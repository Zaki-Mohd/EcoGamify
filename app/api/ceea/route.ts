// app/api/ccea/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend"; // Import Resend

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!); // Initialize Resend

// Shape of a history message
type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    const { message, history } = (await req.json()) as {
      message: string;
      history: HistoryMessage[];
    };

    if (!message)
      return NextResponse.json({ error: "Missing user message" }, { status: 400 });

    // Build the full message list, including history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
        You are a helpful and friendly data assistant for an Environmental Education Dashboard.
        You have access to 4 tables: 'quantum_eco_reality', 'econation', 'waste_hack', and 'schools'.
        
        ### Column Schema
        -   Game Tables: player_name, school_name, email, eco_score, last_active, created_at, etc.
        -   'schools' Table: name, total_score, students_count, location

        ### User Intent Instructions
        You MUST always return a single, valid JSON object for one of four intents: "text", "query", "chart", or "email".
        Use the conversation history for context.

        // 1. TEXT (Greetings, follow-ups, and non-data chat)
        {
          "intent": "text",
          "response": "Hello! How can I help you with the Eco Dashboard data today?"
        }

        // 2. QUERY (Data Table Requests)
        {
          "intent": "query",
          "game": "waste_hack",
          "fields": ["player_name", "school_name", "eco_score"],
          "orderBy": {"column": "eco_score", "direction": "desc"},
          "limit": 5
        }
        
        // 3. CHART (Visualization Requests)
        {
          "intent": "chart",
          "chartType": "bar",
          "dataQuery": {
            "game": "schools",
            "fields": ["name", "total_score"],
            "orderBy": {"column": "total_score", "direction": "desc"},
            "limit": 5
          },
          "complexMetric": null,
          "chartParams": {"category": "name", "metric": "total_score"}
        }

        // 4. EMAIL (Drafting an Email)
        // Use this when the user wants to email a player.
        // You MUST query for the player's email, name, and relevant score.
        // You MUST generate a creative 'subject' and 'body'.
        {
          "intent": "email",
          "dataQuery": {
            "game": "waste_hack",
            "fields": ["player_name", "email", "eco_score"],
            "orderBy": {"column": "eco_score", "direction": "desc"},
            "limit": 1
          },
          "emailContent": {
            "subject": "Congratulations on your Top Score in Waste Hack!",
            "body": "Hi [Player Name],\n\nCongratulations on being the top performer! Your eco_score of [eco_score] is impressive.\n\nKeep up the great work!\n\nBest,\nThe Eco Dashboard Team"
          }
        }
        
        Only return valid JSON, no explanations.
        `,
      },
      ...history,
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ type: "text", text: raw });
    }

    // 1. Handle Text Intent
    if (parsed.intent === "text" && parsed.response) {
      return NextResponse.json({ type: "text", text: parsed.response });
    }

    // 2. Handle Query Intent
    if (parsed.intent === "query" && parsed.game) {
      const { data, error } = await runSupabaseQuery(
        parsed.game,
        parsed.fields,
        parsed.filters,
        parsed.orderBy,
        parsed.limit
      );
      if (error) throw error;
      return NextResponse.json({ 
        type: "data", 
        data,
        textSummary: `I found ${data.length} records for your query.`
      });
    }

    // 3. Handle Chart Intent
    if (parsed.intent === "chart") {
      let data;
      let error;
      let textSummary = `Here is the ${parsed.chartType} chart you requested.`;

      if (parsed.complexMetric) {
        if (parsed.complexMetric === "player_activity_heatmap") {
          console.log("Calling RPC: get_activity_heatmap");
          const { data: heatmapData, error: heatmapError } = await supabase.rpc('get_activity_heatmap');
          data = heatmapData;
          error = heatmapError;
          textSummary = "Here is the player activity heatmap.";
        }
      } else if (parsed.dataQuery) {
        const { game, fields, filters, orderBy, limit } = parsed.dataQuery;
        const { data: simpleData, error: simpleError } = await runSupabaseQuery(
          game, fields, filters, orderBy, limit
        );
        data = simpleData;
        error = simpleError;
      }

      if (error) {
        console.error("Chart data error:", error);
        throw error;
      }
      
      return NextResponse.json({
        type: "chart",
        chartSpec: {
          chartType: parsed.chartType,
          params: parsed.chartParams,
        },
        data: data,
        textSummary: textSummary
      });
    }

    // 4. Handle Email Intent
    if (parsed.intent === "email" && parsed.dataQuery && parsed.emailContent) {
      
      // Step A: Run the query to find the player
      const { game, fields, filters, orderBy, limit } = parsed.dataQuery;
      const { data: playerData, error: playerError } = await runSupabaseQuery(
        game, fields, filters, orderBy, limit
      );

      if (playerError) throw playerError;
      if (!playerData || playerData.length === 0) {
        return NextResponse.json({ 
          type: "text", 
          text: "I couldn't find a player that matches that description." 
        });
      }

      const player = playerData[0];
      const playerEmail = player.email;
      const playerName = player.player_name;

      if (!playerEmail) {
        return NextResponse.json({ 
          type: "text", 
          text: `I found ${playerName}, but I don't have an email address for them.`
        });
      }

      // Step B: Replace placeholders
      let subject = parsed.emailContent.subject;
      let body = parsed.emailContent.body;
      body = body.replace(/\[Player Name\]/g, playerName);
      for (const key in player) {
        const regex = new RegExp(`\\[${key}\\]`, 'g');
        body = body.replace(regex, player[key]);
      }
      body = body.replace(/\[Admin Name\]/g, "The Eco Dashboard Team");
      body = body.replace(/\[eco_score\]/g, player.eco_score); // Explicitly handle eco_score

      // Step C: Send the email with Resend
      try {
        await resend.emails.send({
          // IMPORTANT: Replace 'onboarding@resend.dev'
          // with your own verified domain for production.
          from: 'Eco Dashboard <onboarding@resend.dev>', 
          to: playerEmail,
          subject: subject,
          html: body.replace(/\n/g, '<br>'), // Convert newlines to <br>
        });

        // Return a simple text confirmation
        return NextResponse.json({
          type: "text", 
          text: `✅ Successfully sent email to ${playerName} (${playerEmail})!`
        });

      } catch (emailError: any) {
        console.error("Resend error:", emailError);
        return NextResponse.json({ 
          type: "text", 
          text: `I found ${playerName}, but failed to send the email. Error: ${emailError.message}`
        });
      }
    }

    // Fallback
    return NextResponse.json({ 
      type: "text", 
      text: "I'm not sure how to handle that. Please ask for data, a chart, or to send an email." 
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Helper function to run Supabase queries
 */
async function runSupabaseQuery(
  tableName: string,
  fields: string[],
  filters: any[],
  orderBy: any,
  limit: number
) {
  const selectFields = fields?.join(",") || (tableName === 'schools' ? 'name, total_score, students_count' : '*');
  let query = supabase.from(tableName).select(selectFields);

  if (filters && Array.isArray(filters)) {
    for (const filter of filters) {
      const { column, operator, value } = filter;
      if (!column || !operator || value === undefined) continue;
      switch (operator) {
        case ">": case "gt": query = query.gt(column, value); break;
        case "<": case "lt": query = query.lt(column, value); break;
        case ">=": case "gte": query = query.gte(column, value); break;
        case "<=": case "lte": query = query.lte(column, value); break;
        case "=": case "==": case "eq": query = query.eq(column, value); break;
        case "!=": case "neq": query = query.neq(column, value); break;
        case "ilike": query = query.ilike(column, `%${value}%`); break;
        default: console.warn("Unsupported operator:", operator);
      }
    }
  }

  if (orderBy && orderBy.column && orderBy.direction) {
    query = query.order(orderBy.column, {
      ascending: orderBy.direction === "asc",
    });
  }

  if (limit && typeof limit === 'number') {
    query = query.limit(limit);
  }

  return query; // Returns { data, error }
}
# Use Case Diagram for EcoGamify (Rainforest Viewer)

## Overview
EcoGamify is an environmental education platform that uses interactive games and 3D experiences to teach users about sustainability, coding, and ecological concepts. The application combines gaming mechanics with real-world environmental challenges.

## Actors
- **Student User**: Primary user who plays games and learns about environmental topics
- **Teacher/Admin**: Can access data analytics and send communications to students
- **System (API)**: Handles data queries, chart generation, and email sending

## Use Cases

### Authentication & Navigation
1. **User Registration**
   - Actor: Student User
   - Description: Create a new account to access games
   - Precondition: None
   - Postcondition: User account created, redirected to game selection

2. **User Login**
   - Actor: Student User
   - Description: Authenticate existing account
   - Precondition: User has account
   - Postcondition: User logged in, redirected to game selection

3. **Browse Game Selection**
   - Actor: Student User
   - Description: View available games organized by difficulty level
   - Precondition: User authenticated
   - Postcondition: User can select and start games

### Educational Games

#### School Level Games
4. **Explore Rainforest (3D)**
   - Actor: Student User
   - Description: Navigate 3D rainforest environment, click objects to learn about wildlife and conservation
   - Precondition: Game selected
   - Postcondition: Educational information displayed about clicked objects

5. **President Challenge**
   - Actor: Student User
   - Description: Make environmental policy decisions as a president
   - Precondition: Game selected
   - Postcondition: Score based on environmental impact decisions

6. **President Challenge 2.0**
   - Actor: Student User
   - Description: Advanced version of president challenge with more complex scenarios
   - Precondition: Game selected
   - Postcondition: Advanced scoring and feedback

#### College Level Games
7. **Hack Planet (Coding Game)**
   - Actor: Student User
   - Description: Write JavaScript algorithms to clean polluted environments
   - Precondition: Game selected
   - Postcondition: Code evaluated, environment cleaned if correct

8. **Hack Planet 2 (Advanced Coding)**
   - Actor: Student User
   - Description: More complex coding challenges for environmental cleanup
   - Precondition: Game selected
   - Postcondition: Advanced algorithms tested

9. **Waste Hack (Sorting Game)**
   - Actor: Student User
   - Description: Write algorithms to sort different types of waste materials
   - Precondition: Game selected
   - Postcondition: Waste properly sorted, upcycled items created

### Data Analytics & Communication
10. **Query Student Data**
    - Actor: Teacher/Admin
    - Description: Request data about student performance, game scores, or environmental metrics
    - Precondition: Access to chat interface
    - Postcondition: Data table displayed

11. **Generate Charts**
    - Actor: Teacher/Admin
    - Description: Create visualizations of student data, game performance, or environmental trends
    - Precondition: Access to chat interface
    - Postcondition: Interactive chart displayed

12. **Send Email to Students**
    - Actor: Teacher/Admin
    - Description: Send personalized emails to students based on performance or achievements
    - Precondition: Student data available
    - Postcondition: Email sent to selected students

13. **Chat with Eco Assistant**
    - Actor: Teacher/Admin, Student User
    - Description: Natural language queries about data, charts, or environmental information
    - Precondition: Access to chat interface
    - Postcondition: Responses with data, charts, or email confirmations

## Relationships

### Include Relationships
- Browse Game Selection includes all game use cases
- Chat with Eco Assistant includes Query Student Data, Generate Charts, and Send Email to Students

### Extend Relationships
- Send Email to Students extends Chat with Eco Assistant (when user requests email)
- Generate Charts extends Chat with Eco Assistant (when user requests visualization)

## ASCII Art Diagram

```
+-------------------+     +-------------------+
|   Student User    |     |  Teacher/Admin    |
+-------------------+     +-------------------+
|                   |     |                   |
| - Register        |     | - Query Data      |
| - Login           |     | - Generate Charts |
| - Browse Games    |     | - Send Emails     |
| - Play School Lvl |     | - Chat Assistant  |
| - Play College Lvl|     |                   |
+-------------------+     +-------------------+
          |                           |
          |                           |
          v                           v
+-------------------+     +-------------------+
|   Game Selection  |     |   Chat Interface  |
|   (Main Hub)      |     |   (Eco Assistant) |
+-------------------+     +-------------------+
          |                           |
          |                           |
          v                           v
+-------------------+     +-------------------+
|   School Level    |     |   Data Analytics  |
|   Games           |     |   & Communication |
+-------------------+     +-------------------+
|                   |     |                   |
| - Rainforest 3D   |     | - Data Tables     |
| - President       |     | - Charts          |
| - President 2.0   |     | - Email System    |
+-------------------+     +-------------------+
          |
          |
          v
+-------------------+
| College Level     |
| Games             |
+-------------------+
|                   |
| - Hack Planet     |
| - Hack Planet 2   |
| - Waste Hack      |
+-------------------+
```

## Key System Features
- **Progressive Difficulty**: School level introduces concepts, college level requires coding skills
- **Real-time Feedback**: Immediate evaluation of code and decisions
- **Data-Driven Insights**: Teachers can track student progress and engagement
- **Environmental Education**: All games teach about real-world ecological issues
- **Gamification**: Points, levels, and achievements motivate learning

## Assumptions
- Users have basic computer literacy
- JavaScript knowledge required for college-level games
- Internet connection required for API calls
- Email service configured for teacher communications

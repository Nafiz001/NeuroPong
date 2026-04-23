You are a senior full-stack game developer and AI engineer.

I want you to design and generate a complete project blueprint and starter implementation for a 3D AI vs AI Ping-Pong game called:

"NeuroPong Arena — A 3D AI vs AI Comparative Study using Minimax and Fuzzy Logic"

--------------------------------------------------
🧠 PROJECT GOAL
--------------------------------------------------
Build a fully deterministic 3D Pong game where:
- Two paddles are controlled by AI agents (no human input)
- One AI uses Minimax (planning-based)
- One AI uses Fuzzy Logic (rule-based)
- The system compares their behavior and performance

--------------------------------------------------
👥 TEAM CONSTRAINT (IMPORTANT)
--------------------------------------------------
This is a 2-person project:

1. Nafiz → implements Minimax AI
2. Dewan → implements Fuzzy Logic AI

You MUST:
- Clearly separate responsibilities in code structure
- Keep AI modules independent
- Provide clear interfaces for both AIs to plug into the game loop

--------------------------------------------------
⚙️ TECH STACK (MANDATORY)
--------------------------------------------------
- React (with Vite)
- Three.js + React Three Fiber (for 3D rendering)
- @react-three/rapier (for physics)
- Tailwind CSS (for UI)

--------------------------------------------------
🎮 GAME REQUIREMENTS
--------------------------------------------------
- 3D pong environment (table + paddles + ball)
- Deterministic physics (NO randomness)
- Discrete decision updates
- Paddle actions:
  - Move Up
  - Move Down
  - Stay

- Ball physics:
  - Velocity-based movement
  - Collision with paddles and walls
  - Angle reflection based on impact

--------------------------------------------------
⚡ POWER-UP & ENERGY SYSTEM
--------------------------------------------------
Each AI agent must have:
- Energy bar (0–100)
- Slow energy regeneration

Power-ups (cost energy):
1. Speed Boost → increases paddle speed temporarily
2. Shield → prevents one point loss
3. Ball Slowdown → reduces ball speed temporarily

Constraints:
- No energy → cannot use power-up
- Cooldown system required
- Must be deterministic

--------------------------------------------------
🧠 AI REQUIREMENTS
--------------------------------------------------

🔷 Minimax AI (Nafiz)
- Depth-limited minimax
- Optional alpha-beta pruning
- Simulate future ball positions
- Evaluation function must include:
  - Distance to ball
  - Scoring chance
  - Paddle alignment
  - Energy usage
  - Risk of missing

🔶 Fuzzy Logic AI (Dewan)
- Use fuzzy rule system (no deep search)
- Inputs:
  - Ball distance (near/medium/far)
  - Ball speed (slow/fast)
  - Alignment (good/bad)
  - Energy (low/medium/high)
  - Danger level

- Output:
  - Paddle movement (direction + intensity)

--------------------------------------------------
📊 EVALUATION METRICS
--------------------------------------------------
Include system to track:
- Score
- Rally length
- Energy usage
- Power-up usage frequency
- AI efficiency

--------------------------------------------------
📦 WHAT YOU MUST OUTPUT
--------------------------------------------------

1. 📁 Full Project Folder Structure
2. ⚛️ React + Three Fiber starter code
3. 🎮 Game loop implementation
4. ⚙️ Physics integration using Rapier
5. 🧠 AI Interface Design (important)
6. 🧩 Minimax module (separate file)
7. 🔶 Fuzzy logic module (separate file)
8. ⚡ Power-up + energy system logic
9. 🎯 Example evaluation function (minimax)
10. 📜 Example fuzzy rules table
11. 🔁 Game loop architecture explanation
12. 💡 Suggestions for visualization (optional debug UI)

--------------------------------------------------
⚠️ IMPORTANT RULES
--------------------------------------------------
- Keep AI logic separate from rendering
- Write clean, modular code
- Use clear comments
- Avoid unnecessary complexity
- Keep everything deterministic
- Focus on clarity over completeness

--------------------------------------------------
🎯 GOAL
--------------------------------------------------
The output should be enough for two developers to:
- Start coding immediately
- Divide work cleanly
- Understand how to implement both AIs

Now generate everything step-by-step in a structured way.
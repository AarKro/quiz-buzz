# quiz-buzz ⚡

**quiz-buzz** is a lightweight, serverless digital buzzer web app designed for remote team meetings on Microsoft Teams or Zoom. It solves the problem of participants shouting answers simultaneously during icebreaker quizzes by providing a fair, real-time, first-come-first-served digital buzzer.

No accounts, no installation, and no backend database required — the app is fully static and runs entirely in the browser using WebRTC (PeerJS).

🔗 **Live Application URL**: [https://pages.github.axa.com/aaron-kromer/quiz-buzz/](https://pages.github.axa.com/aaron-kromer/quiz-buzz/)

---

## 🚀 How to Play

### 🎙️ For the Host (Setting up a Session)

1. **Create the Session**:
   - Go to [quiz-buzz](https://pages.github.axa.com/aaron-kromer/quiz-buzz/) and click **"Create a Session"**.
   - Enter a session name (e.g., `Friday Warmup Quiz`) and click **"Create"**.
2. **Invite Your Team**:
   - You will see a large, centered **6-character invite code** (e.g., `X7K2AF`).
   - Click the **"Copy Invite Link"** button to copy a direct-join URL.
   - Share this code or link with your team verbally or via MS Teams chat.
3. **Control the Game**:
   - Once participants join, their names will appear on your dashboard.
   - Click **"Start Round (Buzzers On)"** to make the buzzers active for all players.
   - When someone buzzes, their name is prominently showcased. Award points using **"Correct"** or **"Wrong"**, or click **"Reset"** to clear a false start.
4. **End & Reveal**:
   - At the end of your quiz, click **"End & Reveal Scoreboard"** to simultaneously trigger the animated scoreboard reveal for everyone!

---

### 🕹️ For Participants (Joining a Session)

1. **Join the Lobby**:
   - Click the direct link shared by the host, or go to [quiz-buzz](https://pages.github.axa.com/aaron-kromer/quiz-buzz/), select **"Join a Session"**, and enter the **6-character Invite Code**.
2. **Choose a Name**:
   - Type in a display name, or click the 🔄 refresh icon to auto-generate a funny anonymous animal name (e.g., `Sleepy Narwhal` or `Grumpy Capybara`). Click **"Join Game"**.
3. **Buzz In**:
   - Wait for the host to activate the round. Your button will turn **bold green** with a pulsing glow ring.
   - **Press the large BUZZ! button** (or press Space/Enter on your keyboard) when you know the answer!
   - You'll instantly see if you buzzed in first or if another player beat you to it.
   - Keep track of your own running score right beneath the buzzer!

---

## 🛠️ Developer Setup & Local Run

If you wish to run or build the application locally, follow these simple steps:

```bash
# Clone the repository
git clone https://github.com/aaron-kromer/quiz-buzz.git
cd quiz-buzz

# Install package dependencies
npm install

# Start development server
npm run dev

# Build for production distribution
npm run build

# Deploy production build to GitHub Pages (gh-pages branch)
npm run deploy
```

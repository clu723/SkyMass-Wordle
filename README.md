# SkyMass Wordle

A simple **Wordle** game built using the [SkyMass](https://skymass.dev) library.

---

## How to Run

1. **Set up your project:**
   ```bash
   mkdir skymass && cd skymass
   npm init -y
   npm install @skymass/skymass
   ```

2. **Get your SkyMass API Key**
    You can obtain one from your SkyMass account dashboard

3. **Run the App**
    ```bash
    SKYMASS_KEY=<YOUR_SKYMASS_KEY> node --watch wordle.mjs
    ```

4. **Open the output URL**
    SkyMass will print a local or remote URL — open it in your browser to play!

---

## Dashboard
To view game statistics and player metrics, add this to the end of URL:
/dashboard

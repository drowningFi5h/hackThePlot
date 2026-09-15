
# Hack The Plot

A custom CTF hosting website tailored to fit the needs of TechHunt. 

<!-- <img width="2026" alt="DesktopMockups_TechHunt" src="https://github.com/user-attachments/assets/1c6d7adc-7323-4c9b-b516-31a6fb9ce7ba"> -->
<!-- <img width="2026" alt="DesktopMockups_TechHunt_" src="https://github.com/user-attachments/assets/aeb1ffa3-4441-42b5-a2d6-f257ae5112dd"> -->
<img width="2026" alt="DesktopMockups_TechHunt__" src="https://github.com/user-attachments/assets/e818b4eb-f954-4f61-867b-3af9010d0ce4">


## Features

- Built in 3 days (don't worry you'll find the bugs)
- Segsy UI and animated backgrounds (very cool, very awesome, satisfaction guaranteed)
- Per question asset attachment
- Audio playback hints with synchronised transcriptions
- Custom pool-based harmonic decrement scoring system
- Realtime scoreboard and progression graphs
- User bulk upload

## Installation

Clone the repository
```bash
 git clone https://github.com/steakfisher/hacktheplot.git
```

Switch directory
```bash
 cd hacktheplot
```

Install dependencies 
```bash
 npm install --force
```

Set environment variables (.env.local)
```bash
 DATABASE_URL=postgresql://postgres.username:password@host.pooler.supabase.com:6543/postgres
 AUTH_SECRET="*********" # npx auth secret
 GOOGLE_APP_PASSWORD=*********
 NEXT_PUBLIC_LOCKUP_TIME=1731624972499 # unix timestamp when the website unlocks
```

Setup database schema
```bash
  drizzle-kit push 
```

Run the website
```bash
 npm run dev
```
## Authors

- [@SteakFisher](https://www.github.com/steakfisher)
- [@TheDevyashSaini](https://www.github.com/thedevyashsaini)


## Support Us

We accept payments in
- Cash
- Credit/Debit card
- UPI
- Crypto (anything musk or tate endorses)
- Organs


import json, random
from datetime import datetime, timedelta

days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
start_dt = datetime.strptime("08:00:00", "%H:%M:%S")
end_dt   = datetime.strptime("16:00:00", "%H:%M:%S")
out = "./weekly_8am_to_4pm_every5sec.json"

data = []
for day in days:
    current = start_dt
    row = 1
    while current <= end_dt:
        entry = {
            "Day":    day,
            "Time":   current.strftime("%I:%M:%S %p"),
            "Time24": current.strftime("%H:%M:%S")
        }
        if row <= 6:
            for ch in range(1, 7):
                entry[f"Ch{ch}"] = 1 if ch == row else 0
        else:
            vals = [0]*6
            while sum(vals) == 0:
                vals = [random.randint(0,1) for _ in range(6)]
            for ch in range(1, 7):
                entry[f"Ch{ch}"] = vals[ch-1]
        data.append(entry)
        current += timedelta(seconds=5)
        row += 1

with open(out, "w") as f:
    json.dump(data, f, indent=2)

rows_per_day = int(((end_dt - start_dt).total_seconds()) / 5) + 1
print(f"Created {out}")
print(f"Rows/day: {rows_per_day}")
print(f"Total rows: {len(data)}")

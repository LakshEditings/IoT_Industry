import json, random
from datetime import datetime, timedelta

days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
start_time_str = "08:00:00 AM"
end_time_str = "04:00:00 PM"

rows = []

for day in days:
    start = datetime.strptime(start_time_str, "%I:%M:%S %p")
    end = datetime.strptime(end_time_str, "%I:%M:%S %p")
    
    t = start
    while t <= end:
        # Guarantee at least one channel is active occasionally, but random mostly
        while True:
            vals = [random.randint(0, 1) for _ in range(6)]
            if any(v == 1 for v in vals):
                break
        
        row = {
            "Day": day,
            "Time": t.strftime("%I:%M:%S %p"),
            "Time24": t.strftime("%H:%M:%S")
        }
        
        for i, v in enumerate(vals, start=1):
            row[f"Ch{i}"] = v
            
        rows.append(row)
        t += timedelta(seconds=5)

path = './channel_multi_binary_6days.json'
with open(path, 'w') as f:
    json.dump(rows, f, indent=2)

print(f"Saved {len(rows)} rows to {path}")

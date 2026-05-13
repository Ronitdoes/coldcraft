const greetings = {
  morning:   ["RISE UP","EARLY BIRD","GOOD MORNING",
               "START STRONG","LET'S GO","GRIND TIME"],
  afternoon: ["GOOD AFTERNOON","STILL GRINDING","KEEP GOING","MIDDAY HUSTLE",
               "STAY FOCUSED"],
  evening:   ["GOOD EVENING","GOLDEN HOUR","EVENING GRIND",
               "STAY SHARP"],
  night:     ["NIGHT OWL","STILL UP","LATE NIGHT","CAN'T SLEEP",
               "NIGHT SHIFT","KEEP GRINDING","LIGHTS ON"],
  latenight: ["DEEP NIGHT","WORLD'S ASLEEP","STILL HERE",
               "PAST MIDNIGHT","DEAD HOURS","NEVER STOPPING","RESPECT THOUGH"],
};

export function getGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  let pool: string[];
  if (hour >= 5 && hour < 12)       pool = greetings.morning;
  else if (hour >= 12 && hour < 17)  pool = greetings.afternoon;
  else if (hour >= 17 && hour < 21)  pool = greetings.evening;
  else if (hour >= 21 && hour < 24)  pool = greetings.night;
  else                                pool = greetings.latenight;
  
  const random = pool[Math.floor(Math.random() * pool.length)];
  
  if (!name) return random.toUpperCase() + ".";
  
  const firstName = name.split(" ")[0].toUpperCase();
  return `${random.toUpperCase()}, ${firstName}.`;
}

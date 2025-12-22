# Quest Tree

Auto-generated snapshot of quests, descriptions, and prerequisites for tree sanity checks.
Regenerate by running the helper snippet below from the repo root:

```
node - <<'NODE' > docs/quest-tree.md
const fs = require('fs');
const path = require('path');
const base = 'frontend/src/pages/quests/json';
function walk(dir) {
  return fs.readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) return walk(full);
    const data = JSON.parse(fs.readFileSync(full, "utf8"));
    return [{ ...data }];
  });
}
const quests = walk(base).sort((a, b) => a.id.localeCompare(b.id));
const groups = quests.reduce((acc, q) => {
  const [group] = q.id.split("/");
  (acc[group] = acc[group] || []).push(q);
  return acc;
}, {});
const output = [];
output.push("# Quest Tree", "");
output.push('Auto-generated snapshot of quests, descriptions, and prerequisites for tree sanity checks.', '');
for (const group of Object.keys(groups).sort()) {
  output.push(`\n## ${group}`);
  output.push('| Quest | Description | Requires |');
  output.push('| --- | --- | --- |');
  for (const q of groups[group].sort((a, b) => a.id.localeCompare(b.id))) {
    const requires = (q.requiresQuests || []).length ? q.requiresQuests.join('<br>') : 'None';
    const desc = q.description.replace(/\n/g, ' ');
    output.push(`| ${q.id} | ${desc} | ${requires} |`);
  }
}
fs.writeFileSync('docs/quest-tree.md', output.join('\n'));
NODE
```

## 3dprinter
| Quest | Description | Requires |
| --- | --- | --- |
| 3dprinter/start | Accept Sydney's offer of a 3D printer, and learn how to set it up for use in your space exploration adventure. | welcome/howtodoquests |

## 3dprinting
| Quest | Description | Requires |
| --- | --- | --- |
| 3dprinting/bed-leveling | After power-off and cooling, level the FDM bed with a sheet of printer paper. | 3dprinter/start |
| 3dprinting/benchy_10 | Put your 3D printer to the test! To complete this quest, print at least 10 Benchies. | 3dprinter/start |
| 3dprinting/benchy_100 | Show off your 3D printing prowess! To complete this quest, print at least 100 Benchies. | 3dprinting/benchy_25 |
| 3dprinting/benchy_25 | Increase your 3D printing output! To complete this quest, print at least 25 Benchies. | 3dprinting/benchy_10 |
| 3dprinting/blob-of-death | Skipping a first-layer check lets a failed Z homing extrude in mid-air, engulfing the nozzle in molten plastic. | 3dprinter/start |
| 3dprinting/cable-clip | Reduce clutter by 3D printing a simple cable clip. | 3dprinter/start |
| 3dprinting/calibration-cube | Print and measure a 20 mm calibration cube to verify your printer's accuracy. | 3dprinter/start |
| 3dprinting/filament-change | Swap to green PLA on your entry-level FDM printer with goggles, wire cutters, and a 10 g purge. | 3dprinter/start |
| 3dprinting/nozzle-cleaning | Heat and clean the nozzle to restore smooth extrusion. | 3dprinter/start |
| 3dprinting/nozzle-clog | Disassemble your printer after a blob of death from skipping the first layer to unclog or replace the nozzle. | 3dprinter/start<br>3dprinting/blob-of-death |
| 3dprinting/phone-stand | Practice 3D printing by making a handy phone stand. | 3dprinter/start |
| 3dprinting/retraction-test | Print a single Benchy while adjusting retraction to reduce stringing. | 3dprinting/phone-stand |
| 3dprinting/spool-holder | Keep filament tidy by printing a simple spool holder. | 3dprinter/start |
| 3dprinting/temperature-tower | Find the ideal nozzle temperature by printing a simple calibration tower. | 3dprinting/retraction-test |
| 3dprinting/x-belt-tension | Keep your prints sharp by safely tightening a loose X-axis belt. | 3dprinter/start |

## aquaria
| Quest | Description | Requires |
| --- | --- | --- |
| aquaria/aquarium-light | Add LED lighting to support plant growth and fish health. | aquaria/sponge-filter |
| aquaria/balance-ph | Use buffer solution to adjust tank pH and confirm stability. | aquaria/ph-strip-test |
| aquaria/breeding | Raise the next generation of fish among dense plants. | aquaria/guppy |
| aquaria/filter-rinse | Unplug air pump. Rinse sponge filter in dechlorinated water to restore flow and protect bacteria. | aquaria/sponge-filter |
| aquaria/floating-plants | Introduce guppy grass to help balance nutrients in your tank. | aquaria/shrimp |
| aquaria/goldfish | Goldfish need a fairly large aquarium to be happy, but they're easy to raise. | welcome/howtodoquests<br>aquaria/breeding |
| aquaria/guppy | Introduce colorful guppies to your community tank. | aquaria/water-testing<br>aquaria/heater-install |
| aquaria/heater-install | Install a 150 W heater in a Walstad tank and verify 26°C with a stick-on thermometer. | aquaria/sponge-filter<br>aquaria/thermometer |
| aquaria/log-water-parameters | Use a liquid test kit and logbook to track ammonia, nitrite, nitrate and pH. Wear nitrile gloves. | aquaria/water-testing |
| aquaria/net-fish | Use an aquarium net to move a fish safely during cleaning. | aquaria/water-change |
| aquaria/ph-strip-test | Use a disposable strip to confirm your tank's pH. | aquaria/water-testing |
| aquaria/position-tank | Atlas helps you lift the empty 80 L Walstad aquarium onto a sturdy stand. Clear the path, lift with your legs and keep the glass supported. | aquaria/walstad |
| aquaria/shrimp | Introduce hardy shrimp with drip acclimation to keep the tank clean and water stable. | aquaria/water-testing<br>aquaria/heater-install<br>aquaria/log-water-parameters |
| aquaria/sponge-filter | Add gentle filtration to keep your tank clean without harming shrimp. | aquaria/position-tank |
| aquaria/thermometer | Attach a stick-on strip thermometer outside the aquarium glass to monitor water temperature. | aquaria/position-tank |
| aquaria/top-off | Use a hand pump siphon and aged water to restore aquarium levels. | aquaria/water-change |
| aquaria/walstad | Create a low-tech planted aquarium using the Walstad method. | welcome/howtodoquests |
| aquaria/water-change | Swap out a quarter of the tank water for conditioned tap water to keep fish healthy. | aquaria/guppy |
| aquaria/water-testing | Use the Aquarium liquid test kit to check ammonia, nitrite and nitrate before adding shrimp. Put on nitrile gloves and safety goggles, work in a ventilated area and discard reagents per the kit manual. | aquaria/thermometer |

## astronomy
| Quest | Description | Requires |
| --- | --- | --- |
| astronomy/andromeda | Use a planisphere star chart, a red flashlight and a basic telescope to locate our neighboring galaxy while preserving night vision. | astronomy/basic-telescope |
| astronomy/aurora-watch | Check the aurora forecast and step outside with a red flashlight to log the lights. | astronomy/light-pollution |
| astronomy/basic-telescope | Use 50 mm and 20 mm magnifying lenses, masking tape, a cardboard mailing tube and a camera tripod to build a simple refractor for viewing Jupiter's moons. Work in the shade and never aim at the Sun. | astronomy/observe-moon |
| astronomy/binary-star | Use a basic telescope and planisphere to find Albireo and note its colors. | astronomy/constellations |
| astronomy/comet-tracking | Use your telescope to plot a comet's path across several nights. | astronomy/meteor-shower |
| astronomy/constellations | Identify key star patterns to aid celestial navigation. | astronomy/jupiter-moons |
| astronomy/iss-flyover | Use a satellite-tracking app on your smartphone and a basic telescope to watch the International Space Station pass overhead and log the time in your mission logbook. | astronomy/observe-moon |
| astronomy/iss-photo | Use a tracking app and tripod phone to capture the ISS streak and log it. | astronomy/iss-flyover |
| astronomy/jupiter-moons | Observe the four largest moons nightly to understand orbital motion. | astronomy/basic-telescope |
| astronomy/light-pollution | Count Orion's stars with a planisphere and red flashlight. Log the count. | astronomy/constellations |
| astronomy/lunar-eclipse | Capture images of the Moon as it moves through Earth's shadow. | astronomy/observe-moon |
| astronomy/meteor-shower | Track meteors during a peak shower using a basic telescope, planisphere, red flashlight and mission logbook. | astronomy/jupiter-moons |
| astronomy/north-star | Use the Big Dipper to spot Polaris for navigation practice. | astronomy/constellations |
| astronomy/observe-moon | Use a basic telescope, mission logbook, quill, ink and red flashlight to sketch lunar craters safely. | welcome/howtodoquests |
| astronomy/orion-nebula | Use a planisphere, red flashlight and basic telescope to find the Orion Nebula. | astronomy/andromeda |
| astronomy/planetary-alignment | Use a star chart to track a rare alignment of planets. | astronomy/constellations |
| astronomy/satellite-pass | Nova helps you follow an overhead satellite using your telescope. | astronomy/meteor-shower |
| astronomy/saturn-rings | Use a planisphere and your basic telescope to find Saturn and resolve its rings. | astronomy/basic-telescope |
| astronomy/star-trails | Use long-exposure photography to show the Earth's rotation. | astronomy/constellations |
| astronomy/sunspot-sketch | Project the Sun onto paper with a basic telescope and sketch sunspots in your mission logbook without looking through the eyepiece. | astronomy/basic-telescope |
| astronomy/venus-phases | Use a planisphere and basic telescope to track Venus through its lunar-like phases. | astronomy/saturn-rings |

## chemistry
| Quest | Description | Requires |
| --- | --- | --- |
| chemistry/acid-dilution | Slowly stir 37% hydrochloric acid into water in full PPE over a spill tray. Never add water to acid. | chemistry/ph-test |
| chemistry/acid-neutralization | Use basic chemistry to make a workspace safe again. | chemistry/ph-test |
| chemistry/buffer-solution | Mix vinegar and baking soda to resist pH swings. | chemistry/ph-test |
| chemistry/ph-adjustment | Bring a nutrient solution into range using acid or base. | chemistry/ph-test |
| chemistry/ph-test | Use pH strips to check solution acidity while wearing protective gear. | chemistry/safe-reaction |
| chemistry/precipitation-reaction | Mix two solutions until a solid appears. | chemistry/ph-test |
| chemistry/safe-reaction | Phoenix walks you through a harmless experiment that introduces eco-friendly propellant basics. | welcome/howtodoquests |
| chemistry/stevia-crystals | Purify your extract into concentrated crystals | chemistry/stevia-extraction |
| chemistry/stevia-extraction | Use simple chemistry to make a sweet extract from stevia leaves. | hydroponics/stevia<br>chemistry/safe-reaction |
| chemistry/stevia-tasting | Evaluate the sweetness of your freshly made stevia crystals. | chemistry/stevia-crystals |

## completionist
| Quest | Description | Requires |
| --- | --- | --- |
| completionist/catalog | Log your Completionist Award II so you never misplace it. | completionist/v2 |
| completionist/display | Give your Completionist Award II a dedicated spot on the shelf. | completionist/v2 |
| completionist/polish | Keep your Completionist Award II shiny and proud. | completionist/v2 |
| completionist/reminder | Return regularly to see what fresh challenges await you. | completionist/v2 |
| completionist/v2 | Here's a trophy for your efforts! | welcome/howtodoquests<br>ubi/basicincome<br>3dprinter/start<br>aquaria/water-testing<br>energy/solar-1kWh<br>rocketry/parachute<br>hydroponics/basil |

## composting
| Quest | Description | Requires |
| --- | --- | --- |
| composting/check-temperature | Measure the heat of your compost to ensure active decomposition. | composting/start |
| composting/sift-compost | Screen compost to remove large chunks for a fine finished mix. | composting/turn-pile |
| composting/start | Begin recycling kitchen scraps into soil. | hydroponics/reservoir-refresh |
| composting/turn-pile | Aerate the compost by stirring the mix so microbes stay active. | composting/start |

## devops
| Quest | Description | Requires |
| --- | --- | --- |
| devops/auto-updates | Keep your Pi cluster secure with unattended upgrades. | devops/monitoring |
| devops/ci-pipeline | Configure GitHub Actions to run tests whenever you push. | devops/docker-compose |
| devops/daily-backups | Use a cron job to archive your game data each night. | devops/monitoring |
| devops/docker-compose | Start DSPACE with Docker Compose and expose it securely through a Cloudflare Tunnel. | devops/prepare-first-node |
| devops/enable-https | Use Let's Encrypt to add TLS encryption to your services. | devops/daily-backups |
| devops/fail2ban | Install Fail2ban to ban repeated failed logins. | devops/ssh-hardening |
| devops/firewall-rules | Lock down network ports to only what you need. | devops/auto-updates |
| devops/k3s-deploy | Orion teaches you how to run DSPACE across multiple Pis with k3s. | devops/docker-compose |
| devops/log-maintenance | Prevent logs from filling your server by compressing old files. | devops/daily-backups |
| devops/monitoring | Install Prometheus and Grafana to monitor your Pi cluster. | devops/k3s-deploy |
| devops/pi-cluster-hardware | Orion lists the parts needed to build a Raspberry Pi cluster. | sysadmin/basic-commands |
| devops/prepare-first-node | Flash the OS and install Docker under Orion's guidance. | devops/pi-cluster-hardware |
| devops/private-registry | Host your own Docker images on the cluster. | devops/docker-compose |
| devops/ssd-boot | Clone the OS to an SSD and enable M.2 boot. | devops/prepare-first-node |
| devops/ssh-hardening | Use key-based authentication and disable password logins. | devops/firewall-rules |

## electronics
| Quest | Description | Requires |
| --- | --- | --- |
| electronics/arduino-blink | Learn to program a microcontroller by blinking an LED. | electronics/basic-circuit |
| electronics/basic-circuit | Wire a 5 mm LED and 220 Ω resistor on a breadboard to learn basic circuits. | welcome/howtodoquests |
| electronics/check-battery-voltage | Use a digital multimeter to check a 12 V LiFePO4 battery pack after disconnecting it and placing it on a dry, non-conductive surface. Wear safety goggles throughout. | electronics/basic-circuit |
| electronics/continuity-test | Use a digital multimeter in continuity mode to check an unplugged USB cable while wearing safety goggles. | electronics/solder-wire |
| electronics/data-logger | Use a Raspberry Pi to record readings from your thermistor. | electronics/thermistor-reading |
| electronics/desolder-component | Remove a through-hole resistor from a scrap PCB using a desoldering pump, flux pen and solder wick. Work in a ventilated area and wear safety goggles. | electronics/solder-wire |
| electronics/led-polarity | Use a digital multimeter's diode mode to find which lead of a loose 5 mm LED is positive. Disconnect power, work on a dry non-conductive surface, wear safety goggles, and only use the meter's built-in diode test. | electronics/check-battery-voltage |
| electronics/light-sensor | Use a photoresistor and Arduino to measure ambient brightness. | electronics/basic-circuit |
| electronics/measure-arduino-5v | Verify the 5 V pin on an Arduino Uno with a multimeter. | electronics/arduino-blink |
| electronics/measure-led-current | Use a digital multimeter to measure the current through a basic LED circuit. | electronics/basic-circuit |
| electronics/measure-resistance | Use a digital multimeter to confirm a loose resistor's value. Disconnect all power, keep metal jewelry off, set components on a dry non-conductive surface, and wear safety goggles. | electronics/resistor-color-check |
| electronics/potentiometer-dimmer | Adjust LED brightness using a potentiometer and an Arduino. | electronics/arduino-blink |
| electronics/resistor-color-check | Confirm a resistor's value by decoding its color bands before installing it in a circuit. | electronics/basic-circuit |
| electronics/servo-sweep | Use the Arduino IDE's Servo library 'Sweep' example to rotate a hobby servo from 0° to 180°. | electronics/arduino-blink |
| electronics/solder-led-harness | Join a 5 mm LED and 220 Ω resistor to two jumper wires using a soldering iron kit. Ventilate and wear safety goggles. | electronics/tin-soldering-iron |
| electronics/solder-wire | Join jumper wires with a soldering kit, heat-shrink tubing, and a heat gun. Keep a brass tip cleaner handy, ventilate, and wear safety goggles. | electronics/tin-soldering-iron |
| electronics/temperature-plot | Generate a chart from your thermistor log using Python. | electronics/data-logger |
| electronics/test-gfci-outlet | Verify a ground-fault circuit interrupter outlet with a plug-in tester. | electronics/continuity-test |
| electronics/thermistor-reading | Wire a thermistor to your Arduino and log temperature values. | electronics/potentiometer-dimmer |
| electronics/thermometer-calibration | Use water baths to verify your thermometer's accuracy. | electronics/thermistor-reading |
| electronics/tin-soldering-iron | Prepare your soldering iron for clean joints by tinning the tip. | electronics/basic-circuit |
| electronics/voltage-divider | Split 5 V to about 2.5 V using 220 Ω and 10 kΩ resistors on a Breadboard. | electronics/basic-circuit |

## energy
| Quest | Description | Requires |
| --- | --- | --- |
| energy/battery-maintenance | Cycle your 200 Wh battery pack with solar to keep it healthy. | energy/solar |
| energy/battery-upgrade | Expand your solar setup with a 1 kWh storage pack and enclosure. | energy/solar |
| energy/biogas-digester | Ferment kitchen scraps into methane for cooking. | energy/solar-1kWh |
| energy/charge-controller-setup | Wire and configure a charge controller to safely charge your 200 Wh battery. | energy/solar |
| energy/dSolar-100kW | Set new standards in solar energy production! To complete this quest, have at least 100,000 dSolar in your inventory. | energy/dSolar-10kW |
| energy/dSolar-10kW | Push the boundaries of energy production! To complete this quest, have at least 10,000 dSolar in your inventory. | energy/dSolar-1kW |
| energy/dSolar-1kW | Reach increasingly higher levels of energy production! To complete this quest, have at least 1,000 dSolar in your inventory. | energy/solar-1kWh |
| energy/dWatt-1e3 | Boost your energy potential! To unlock this quest's reward, accumulate at least 1,000 dWatt in your inventory. | energy/solar |
| energy/dWatt-1e4 | Supercharge your energy reserves! To claim your prize, gather at least 10,000 dWatt in your inventory. | energy/dWatt-1e3 |
| energy/dWatt-1e5 | Ascent to greater heights in energy collection! To be rewarded, amass a significant 100,000 dWatt. | energy/dWatt-1e4 |
| energy/dWatt-1e6 | Reach the pinnacle of energy gathering! Secure your legacy by accumulating 1,000,000 dWatt. | energy/dWatt-1e4 |
| energy/dWatt-1e7 | Challenge the very fabric of what's considered possible! Conquer this monumental task by stockpiling 10,000,000 dWatt. | energy/dWatt-1e5 |
| energy/dWatt-1e8 | Prove your dedication by collecting a staggering 100,000,000 dWatt. | energy/dWatt-1e7 |
| energy/hand-crank-generator | Print parts and assemble a hand crank generator to charge a 200 Wh battery pack. | energy/solar |
| energy/offgrid-charger | Charge a phone off-grid with a 200 W panel, charge controller, 200 Wh LiFePO4 battery and USB cable. | energy/solar |
| energy/portable-solar-panel | Harvest sunshine anywhere with a foldable panel. | energy/solar |
| energy/power-inverter | Convert your battery's DC output into AC for household gear. | energy/battery-upgrade |
| energy/solar | The wall outlet is convenient, but your utility uses fossil fuels for electricity generation! Let's take things in our own hands and start going off the grid. | welcome/howtodoquests |
| energy/solar-1kWh | Swap out that tiny 200 Wh battery pack for a new 1 kWh one! No upgrade in charge speed just yet, just more capacity! | energy/solar |
| energy/solar-tracker | Rotate your 200 Wh kit to follow the sun. | energy/solar |
| energy/wind-turbine | Supplement your solar setup with power from the breeze. | energy/solar-1kWh |

## firstaid
| Quest | Description | Requires |
| --- | --- | --- |
| firstaid/assemble-kit | Assemble a basic first aid kit so you're ready for minor injuries. | welcome/howtodoquests |
| firstaid/change-bandage | Swap an old bandage for a fresh one to keep a minor cut clean. | firstaid/wound-care |
| firstaid/dispose-bandages | Use a biohazard bag to discard used bandages and wash up. | firstaid/change-bandage |
| firstaid/dispose-expired | Clear out old items so your first aid kit stays reliable. | firstaid/restock-kit |
| firstaid/flashlight-battery | Measure your emergency flashlight's 9 V battery with a digital multimeter. | firstaid/assemble-kit |
| firstaid/learn-cpr | Practice 30:2 compressions on a CPR manikin using nitrile gloves, a pocket mask and antiseptic wipes from your first aid kit. Confirm the area is safe, call emergency services first and sanitize gear after. This exercise does not replace formal certification. | firstaid/assemble-kit |
| firstaid/remove-splinter | Take out a small splinter to prevent infection. | firstaid/wound-care |
| firstaid/restock-kit | Replace used supplies so you're ready for emergencies. | firstaid/assemble-kit |
| firstaid/sanitize-pocket-mask | Clean and disinfect your CPR mask so it's safe for the next emergency. | firstaid/learn-cpr |
| firstaid/splint-limb | Practice immobilizing a minor limb injury with supplies from a first aid kit. Only attempt this on stable injuries and call emergency services for serious fractures. | firstaid/wound-care |
| firstaid/stop-nosebleed | Sit upright, lean forward, and pinch the soft part of your nose with a sterile gauze pad. Wear nitrile gloves from a first aid kit, use an antiseptic wipe around your nostrils after bleeding slows, and keep your head tilted forward the whole time. Never tilt your head back or insert anything into the nostrils. | firstaid/assemble-kit |
| firstaid/treat-burn | Cool and dress a small burn so it heals cleanly. | firstaid/assemble-kit |
| firstaid/wound-care | Practice cleaning a minor cut with soap, gloves, an antiseptic wipe, antibiotic ointment and a bandage. | firstaid/learn-cpr |

## geothermal
| Quest | Description | Requires |
| --- | --- | --- |
| geothermal/backflush-loop-filter | Use a submersible pump to rinse debris from the geothermal loop filter. | geothermal/purge-loop-air |
| geothermal/calibrate-ground-sensor | Use ice and boiling water to calibrate your thermistor before burying it. | geothermal/survey-ground-temperature |
| geothermal/check-loop-inlet-temp | Use an Arduino to log the water temperature entering the heat pump. | geothermal/survey-ground-temperature |
| geothermal/check-loop-outlet-temp | Log the water temperature leaving the heat pump with an Arduino thermistor. | geothermal/check-loop-inlet-temp |
| geothermal/check-loop-pressure | Verify the ground loop is holding pressure with a quick gauge check. | geothermal/survey-ground-temperature |
| geothermal/check-loop-temp-delta | Use two thermistors with an Arduino to compare loop inlet and outlet temps. | geothermal/check-loop-inlet-temp<br>geothermal/check-loop-outlet-temp |
| geothermal/compare-depth-ground-temps | Bury two thermistors at different depths and log their readings for a day. | geothermal/log-ground-temperature |
| geothermal/compare-seasonal-ground-temps | Use a second thermistor to log ground temperatures in different seasons. | geothermal/log-ground-temperature |
| geothermal/install-backup-thermistor | Add a second probe so you can cross-check ground temperature readings. | geothermal/calibrate-ground-sensor |
| geothermal/log-ground-temperature | Use a buried thermistor with Arduino to monitor ground temperature over time. | geothermal/survey-ground-temperature |
| geothermal/log-heat-pump-warmup | Track how quickly the loop temperature rises after startup. | geothermal/log-ground-temperature |
| geothermal/monitor-heat-pump-energy | Install a smart plug to track how much power your ground loop consumes. | geothermal/survey-ground-temperature |
| geothermal/purge-loop-air | Use a submersible pump to flush out trapped bubbles from your geothermal loop. | geothermal/survey-ground-temperature |
| geothermal/replace-faulty-thermistor | Swap out a dead probe and verify readings stay true. | geothermal/install-backup-thermistor |
| geothermal/survey-ground-temperature | Measure the ground temperature to see if a heat pump will work. | energy/solar |

## hydroponics
| Quest | Description | Requires |
| --- | --- | --- |
| hydroponics/air-stone-soak | Prime the air stone so bubbles stay even. | hydroponics/filter-clean |
| hydroponics/basil | Learn how to grow plants without soil! | welcome/howtodoquests |
| hydroponics/bucket_10 | Have 10 buckets of dechlorinated water in your inventory. For some reason. | hydroponics/basil<br>3dprinter/start |
| hydroponics/ec-calibrate | Use calibration solution so readings stay accurate. | hydroponics/ph-check |
| hydroponics/ec-check | Measure nutrient strength with an EC meter. | hydroponics/ec-calibrate |
| hydroponics/filter-clean | Clear out the gunk so the roots can breathe. | hydroponics/top-off |
| hydroponics/grow-light | Mount a full-spectrum LED grow lamp and automate a 12 h light cycle with a smart plug and timer. | hydroponics/bucket_10 |
| hydroponics/lettuce | Plant lettuce seeds and harvest fresh leaves using your hydroponic setup. | hydroponics/basil |
| hydroponics/mint-cutting | Root a mint sprig for endless tea. | hydroponics/plug-soak |
| hydroponics/netcup-clean | Sanitize net cups to keep roots disease-free. | hydroponics/tub-scrub |
| hydroponics/nutrient-check | Top off your hydroponic tub with fresh nutrients while keeping yourself and the plants safe. | hydroponics/basil |
| hydroponics/ph-check | Measure the nutrient bath's pH and correct it to keep plants happy. | hydroponics/nutrient-check |
| hydroponics/ph-test | Check acidity so your plants stay healthy. | hydroponics/nutrient-check |
| hydroponics/plug-soak | Hydrate rockwool cubes so seeds sprout happily. | hydroponics/top-off |
| hydroponics/pump-install | Add circulation to keep nutrients moving. | hydroponics/reservoir-refresh |
| hydroponics/pump-prime | Prep the pump so it doesn't run dry. | hydroponics/pump-install |
| hydroponics/regrow-stevia | Hydro shows you how to coax another harvest from trimmed plants. | hydroponics/stevia |
| hydroponics/reservoir-refresh | Swap out old nutrient solution for a fresh batch. | hydroponics/basil |
| hydroponics/root-rinse | Flush salts from the root zone with clean water. | hydroponics/filter-clean |
| hydroponics/stevia | Cultivate stevia plants for a natural sweetener. | hydroponics/lettuce |
| hydroponics/temp-check | Make sure the reservoir stays in the sweet spot. | hydroponics/nutrient-check |
| hydroponics/top-off | Add fresh water to keep nutrient levels stable. | hydroponics/pump-install |
| hydroponics/tub-scrub | Remove biofilm from the reservoir walls. | hydroponics/reservoir-refresh |

## programming
| Quest | Description | Requires |
| --- | --- | --- |
| programming/avg-temp | Write a small script that reads your log file and prints the daily average temperature. | programming/temp-logger |
| programming/graph-temp | Visualize the data you recorded with temp-logger. | programming/temp-logger |
| programming/graph-temp-data | Use a short script to plot the readings you've been recording. | programming/temp-logger |
| programming/hello-sensor | dChat shows you how a short script can capture sensor information for later analysis. | electronics/arduino-blink |
| programming/http-post | Update your server to handle POST requests and log JSON payloads. | programming/json-api |
| programming/json-api | Extend your server to respond with structured JSON. | programming/web-server |
| programming/json-endpoint | Extend your server to respond with structured JSON. | programming/web-server |
| programming/median-temp | Extend your script to report the median temperature from your log. | programming/avg-temp |
| programming/moving-avg-temp | Add a moving average to your temperature analysis script. | programming/avg-temp |
| programming/plot-temp-cli | Use Python to turn your temperature log into a line chart. | programming/temp-logger |
| programming/stddev-temp | Extend your script to report the standard deviation of daily temperature readings. | programming/median-temp |
| programming/temp-alert | Write a script that warns you when the sensor crosses a threshold. | programming/temp-graph |
| programming/temp-email | Trigger an email when the sensor exceeds a set temperature. | programming/temp-alert |
| programming/temp-graph | Plot the values from your logger to visualize trends over time. | programming/temp-logger |
| programming/temp-json-api | Expose the latest sensor reading at a JSON endpoint. | programming/json-api |
| programming/temp-logger | Write a simple script that records hourly temperature readings. | electronics/thermistor-reading |
| programming/thermistor-calibration | Use a 10k thermistor to measure temperature accurately with an Arduino script. | programming/hello-sensor |
| programming/web-server | Write a tiny HTTP server that responds with 'Hello, world'. | programming/hello-sensor |

## robotics
| Quest | Description | Requires |
| --- | --- | --- |
| robotics/gyro-balance | Pair a gyro with tuned servo control so a two-wheeled platform can catch itself before tipping over. | robotics/odometry-basics |
| robotics/line-follower | Train a two-wheel bot to read line sensors and stay on a taped track while you tune the code. | robotics/servo-control<br>programming/hello-sensor<br>electronics/light-sensor |
| robotics/maze-navigation | Layer line following, distance sensing, and encoder feedback to clear a taped maze without getting lost. | robotics/obstacle-avoidance<br>robotics/odometry-basics |
| robotics/obstacle-avoidance | Give your line follower the awareness to pause, scan, and steer around boxes without leaving the track. | robotics/line-follower<br>robotics/ultrasonic-rangefinder |
| robotics/odometry-basics | Convert encoder ticks into centimeters traveled so navigation code can estimate position between sensor readings. | robotics/wheel-encoders |
| robotics/pan-tilt | Build a two-axis mount so cameras or sensors can pan and tilt to survey the space around your robot. | robotics/servo-control |
| robotics/servo-arm | Assemble a two-joint servo arm with a gripper so you can practice smooth pick-and-place moves. | robotics/servo-gripper |
| robotics/servo-control | Wire a hobby servo to your Arduino and use the Sweep example to understand position control. | electronics/arduino-blink |
| robotics/servo-gripper | Cut and hinge two jaws onto a micro servo so your robot can pinch and release small objects safely. | robotics/servo-control |
| robotics/servo-radar | Combine a pan-tilt mount and ultrasonic sensor to sweep the room and build a quick proximity map. | robotics/pan-tilt<br>robotics/ultrasonic-rangefinder |
| robotics/ultrasonic-rangefinder | Wire and test an HC-SR04 so your Arduino can report clear distance readings for navigation code. | electronics/arduino-blink |
| robotics/wheel-encoders | Install wheel encoders so your robot can measure distance, hold headings, and repeat paths reliably. | robotics/servo-control |

## rocketry
| Quest | Description | Requires |
| --- | --- | --- |
| rocketry/firstlaunch | Print and launch your own model rocket. Follow the steps to print, assemble, and launch the rocket. Get ready for liftoff! | 3dprinter/start |
| rocketry/fuel-mixture | Dial in a safe oxidizer-to-fuel ratio for a hobbyist model rocket before launch. | rocketry/firstlaunch |
| rocketry/guided-rocket-build | Print a servo-ready fincan, assemble the avionics, and program guidance for a camera-equipped hop. | rocketry/firstlaunch<br>rocketry/parachute<br>rocketry/preflight-check |
| rocketry/night-launch | Take your rocket experience to the stars with a night launch. Gather your gear and light up the sky. | rocketry/recovery-run |
| rocketry/parachute | Upgrade your rocket with a nylon parachute for gentle landings and possible reuse. | rocketry/firstlaunch |
| rocketry/preflight-check | Confirm gear and run a quick launch sequence. | rocketry/firstlaunch |
| rocketry/recovery-run | Launch with a parachute and retrieve the rocket intact. | rocketry/parachute |
| rocketry/static-test | Fire your rocket engine while it's secured to verify thrust and stability. | rocketry/parachute |
| rocketry/suborbital-hop | Run the guided hop simulator, prep the range, and fly a servo-stabilized model rocket with onboard video. | rocketry/recovery-run<br>rocketry/preflight-check<br>rocketry/guided-rocket-build |
| rocketry/wind-check | Measure wind speed to ensure safe rocket launches. | rocketry/preflight-check |

## sysadmin
| Quest | Description | Requires |
| --- | --- | --- |
| sysadmin/basic-commands | Practice core shell commands on an Ubuntu 24.04 LTS Minimal server. | welcome/howtodoquests |
| sysadmin/log-analysis | Use journalctl and tail to spot issues on Ubuntu 24.04 LTS Minimal. | sysadmin/resource-monitoring |
| sysadmin/resource-monitoring | Track CPU, memory, and disk on Ubuntu 24.04 LTS Minimal using top and df. | sysadmin/basic-commands |

## ubi
| Quest | Description | Requires |
| --- | --- | --- |
| ubi/basicincome | Learn about the basic income system and how to earn dUSD. | 3dprinter/start |
| ubi/first-payment | Withdraw your daily dUSD for the first time. | ubi/basicincome |
| ubi/reminder | Schedule a daily reminder so you never miss your dUSD payout. | ubi/first-payment |
| ubi/savings-goal | Set aside some dUSD for future plans. | ubi/first-payment |

## welcome
| Quest | Description | Requires |
| --- | --- | --- |
| welcome/connect-github | Link your GitHub account to enable cloud sync and quest submissions. | welcome/howtodoquests |
| welcome/howtodoquests | Learn how quest mechanics work, including dialogue choices, real items, and safe processes. | None |
| welcome/intro-inventory | Learn how to view items you've collected so far. | welcome/howtodoquests |
| welcome/run-tests | Learn how to run DSPACE's automated tests to ensure your changes are correct. | welcome/howtodoquests |
| welcome/smart-plug-test | Use a smart plug to buy 1 kWh from a wall outlet and mint 1,000 dWatt tokens. | welcome/howtodoquests |

## woodworking
| Quest | Description | Requires |
| --- | --- | --- |
| woodworking/apply-finish | Brush on a thin protective finish that resists moisture and highlights the grain you just sanded smooth. | woodworking/finish-sanding |
| woodworking/birdhouse | Start woodworking with a straightforward birdhouse that teaches measuring, safe cuts, and clean glue joints. | welcome/howtodoquests |
| woodworking/bookshelf | Apply your skills to assemble a functional bookshelf. | woodworking/step-stool |
| woodworking/coffee-table | Craft a low table to anchor your living space. | woodworking/bookshelf |
| woodworking/finish-sanding | Smooth the surface of your latest build with fine-grit paper before applying finish. | woodworking/step-stool |
| woodworking/picture-frame | Make a simple frame to showcase your favorite photo. | woodworking/tool-rack |
| woodworking/planter-box | Cut and nail a cedar planter box that introduces square joints and waterproof glue-ups. | woodworking/birdhouse |
| woodworking/step-stool | Build a sturdy pine step stool and practice safe cutting and gluing. | woodworking/workbench<br>woodworking/planter-box |
| woodworking/tool-rack | Organize your workspace with a simple rack for hand tools. | woodworking/workbench |
| woodworking/workbench | Upgrade from a makeshift surface to a level, clamped-together workbench that can handle real projects. | woodworking/birdhouse |

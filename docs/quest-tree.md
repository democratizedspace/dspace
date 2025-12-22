# Quest Tree

Auto-generated snapshot of quests, titles, descriptions, and prerequisites for tree sanity checks.
Regenerate with `npm run gen:quest-tree`.

## 3dprinter
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| 3dprinter/start | Set up your first 3D printer | Accept Sydney's offer of a 3D printer, and learn how to set it up for use in your space exploration adventure. | welcome/howtodoquests |

## 3dprinting
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| 3dprinting/bed-leveling | Level the Print Bed | After power-off and cooling, level the FDM bed with a sheet of printer paper. | 3dprinter/start |
| 3dprinting/benchy_10 | 3D Print 10 Benchies | Put your 3D printer to the test! To complete this quest, print at least 10 Benchies. | 3dprinter/start |
| 3dprinting/benchy_100 | 3D Print 100 Benchies | Show off your 3D printing prowess! To complete this quest, print at least 100 Benchies. | 3dprinting/benchy_25 |
| 3dprinting/benchy_25 | 3D Print 25 Benchies | Increase your 3D printing output! To complete this quest, print at least 25 Benchies. | 3dprinting/benchy_10 |
| 3dprinting/blob-of-death | Witness a Blob of Death | Skipping a first-layer check lets a failed Z homing extrude in mid-air, engulfing the nozzle in molten plastic. | 3dprinter/start |
| 3dprinting/cable-clip | Print a Cable Clip | Reduce clutter by 3D printing a simple cable clip. | 3dprinter/start |
| 3dprinting/calibration-cube | Print a Calibration Cube | Print and measure a 20 mm calibration cube to verify your printer's accuracy. | 3dprinter/start |
| 3dprinting/filament-change | Swap Filament | Swap to green PLA on your entry-level FDM printer with goggles, wire cutters, and a 10 g purge. | 3dprinter/start |
| 3dprinting/nozzle-cleaning | Clear a Clogged Nozzle | Heat and clean the nozzle to restore smooth extrusion. | 3dprinter/start |
| 3dprinting/nozzle-clog | Fix a Clogged Nozzle | Disassemble your printer after a blob of death from skipping the first layer to unclog or replace the nozzle. | 3dprinter/start<br>3dprinting/blob-of-death |
| 3dprinting/phone-stand | Print a Phone Stand | Practice 3D printing by making a handy phone stand. | 3dprinter/start |
| 3dprinting/retraction-test | Tune Retraction Settings | Print a single Benchy while adjusting retraction to reduce stringing. | 3dprinting/phone-stand |
| 3dprinting/spool-holder | Print a Spool Holder | Keep filament tidy by printing a simple spool holder. | 3dprinter/start |
| 3dprinting/temperature-tower | Print a Temperature Tower | Find the ideal nozzle temperature by printing a simple calibration tower. | 3dprinting/retraction-test |
| 3dprinting/x-belt-tension | Tighten the X-axis Belt | Keep your prints sharp by safely tightening a loose X-axis belt. | 3dprinter/start |

## aquaria
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| aquaria/aquarium-light | Install an aquarium light | Add LED lighting to support plant growth and fish health. | aquaria/sponge-filter |
| aquaria/balance-ph | Balance aquarium pH | Use buffer solution to adjust tank pH and confirm stability. | aquaria/ph-strip-test |
| aquaria/breeding | Breed your guppies | Raise the next generation of fish among dense plants. | aquaria/guppy |
| aquaria/filter-rinse | Rinse Sponge Filter | Unplug air pump. Rinse sponge filter in dechlorinated water to restore flow and protect bacteria. | aquaria/sponge-filter |
| aquaria/floating-plants | Add Floating Plants | Introduce guppy grass to help balance nutrients in your tank. | aquaria/shrimp |
| aquaria/goldfish | Set up an aquarium for a goldfish | Goldfish need a fairly large aquarium to be happy, but they're easy to raise. | welcome/howtodoquests<br>aquaria/breeding |
| aquaria/guppy | Add guppies | Introduce colorful guppies to your community tank. | aquaria/water-testing<br>aquaria/heater-install |
| aquaria/heater-install | Install an aquarium heater | Install a 150 W heater in a Walstad tank and verify 26°C with a stick-on thermometer. | aquaria/sponge-filter<br>aquaria/thermometer |
| aquaria/log-water-parameters | Log Water Parameters | Use a liquid test kit and logbook to track ammonia, nitrite, nitrate and pH. Wear nitrile gloves. | aquaria/water-testing |
| aquaria/net-fish | Catch a fish with a net | Use an aquarium net to move a fish safely during cleaning. | aquaria/water-change |
| aquaria/ph-strip-test | Check aquarium pH | Use a disposable strip to confirm your tank's pH. | aquaria/water-testing |
| aquaria/position-tank | Move the Walstad tank | Atlas helps you lift the empty 80 L Walstad aquarium onto a sturdy stand. Clear the path, lift with your legs and keep the glass supported. | aquaria/walstad |
| aquaria/shrimp | Add dwarf shrimp | Introduce hardy shrimp with drip acclimation to keep the tank clean and water stable. | aquaria/water-testing<br>aquaria/heater-install<br>aquaria/log-water-parameters |
| aquaria/sponge-filter | Install a sponge filter | Add gentle filtration to keep your tank clean without harming shrimp. | aquaria/position-tank |
| aquaria/thermometer | Attach Aquarium Thermometer | Attach a stick-on strip thermometer outside the aquarium glass to monitor water temperature. | aquaria/position-tank |
| aquaria/top-off | Top Off Evaporated Water | Use a hand pump siphon and aged water to restore aquarium levels. | aquaria/water-change |
| aquaria/walstad | Set up a Walstad tank | Create a low-tech planted aquarium using the Walstad method. | welcome/howtodoquests |
| aquaria/water-change | Perform a partial water change | Swap out a quarter of the tank water for conditioned tap water to keep fish healthy. | aquaria/guppy |
| aquaria/water-testing | Test water parameters | Use the Aquarium liquid test kit to check ammonia, nitrite and nitrate before adding shrimp. Put on nitrile gloves and safety goggles, work in a ventilated area and discard reagents per the kit manual. | aquaria/thermometer |

## astronomy
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| astronomy/andromeda | Locate the Andromeda Galaxy | Use a planisphere star chart, a red flashlight and a basic telescope to locate our neighboring galaxy while preserving night vision. | astronomy/basic-telescope |
| astronomy/aurora-watch | Watch the Aurora | Check the aurora forecast and step outside with a red flashlight to log the lights. | astronomy/light-pollution |
| astronomy/basic-telescope | Assemble a Simple Telescope | Use 50 mm and 20 mm magnifying lenses, masking tape, a cardboard mailing tube and a camera tripod to build a simple refractor for viewing Jupiter's moons. Work in the shade and never aim at the Sun. | astronomy/observe-moon |
| astronomy/binary-star | Split a Binary Star | Use a basic telescope and planisphere to find Albireo and note its colors. | astronomy/constellations |
| astronomy/comet-tracking | Track a Visiting Comet | Use your telescope to plot a comet's path across several nights. | astronomy/meteor-shower |
| astronomy/constellations | Map the Constellations | Identify key star patterns to aid celestial navigation. | astronomy/jupiter-moons |
| astronomy/iss-flyover | Spot the ISS | Use a satellite-tracking app on your smartphone and a basic telescope to watch the International Space Station pass overhead and log the time in your mission logbook. | astronomy/observe-moon |
| astronomy/iss-photo | Photograph the ISS | Use a tracking app and tripod phone to capture the ISS streak and log it. | astronomy/iss-flyover |
| astronomy/jupiter-moons | Track Jupiter's Moons | Observe the four largest moons nightly to understand orbital motion. | astronomy/basic-telescope |
| astronomy/light-pollution | Measure Light Pollution | Count Orion's stars with a planisphere and red flashlight. Log the count. | astronomy/constellations |
| astronomy/lunar-eclipse | Photograph a Lunar Eclipse | Capture images of the Moon as it moves through Earth's shadow. | astronomy/observe-moon |
| astronomy/meteor-shower | Document a Meteor Shower | Track meteors during a peak shower using a basic telescope, planisphere, red flashlight and mission logbook. | astronomy/jupiter-moons |
| astronomy/north-star | Locate the North Star | Use the Big Dipper to spot Polaris for navigation practice. | astronomy/constellations |
| astronomy/observe-moon | Observe the Moon | Use a basic telescope, mission logbook, quill, ink and red flashlight to sketch lunar craters safely. | welcome/howtodoquests |
| astronomy/orion-nebula | Observe the Orion Nebula | Use a planisphere, red flashlight and basic telescope to find the Orion Nebula. | astronomy/andromeda |
| astronomy/planetary-alignment | Planetary Alignment | Use a star chart to track a rare alignment of planets. | astronomy/constellations |
| astronomy/satellite-pass | Track a Satellite Pass | Nova helps you follow an overhead satellite using your telescope. | astronomy/meteor-shower |
| astronomy/saturn-rings | Spot Saturn's Rings | Use a planisphere and your basic telescope to find Saturn and resolve its rings. | astronomy/basic-telescope |
| astronomy/star-trails | Capture Star Trails | Use long-exposure photography to show the Earth's rotation. | astronomy/constellations |
| astronomy/sunspot-sketch | Sketch Sunspots | Project the Sun onto paper with a basic telescope and sketch sunspots in your mission logbook without looking through the eyepiece. | astronomy/basic-telescope |
| astronomy/venus-phases | Observe Venus's Phases | Use a planisphere and basic telescope to track Venus through its lunar-like phases. | astronomy/saturn-rings |

## chemistry
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| chemistry/acid-dilution | Dilute Hydrochloric Acid Safely | Slowly stir 37% hydrochloric acid into water in full PPE over a spill tray. Never add water to acid. | chemistry/ph-test |
| chemistry/acid-neutralization | Neutralize an Acid Spill | Use basic chemistry to make a workspace safe again. | chemistry/ph-test |
| chemistry/buffer-solution | Prepare a Buffer Solution | Mix vinegar and baking soda to resist pH swings. | chemistry/ph-test |
| chemistry/ph-adjustment | Adjust Solution pH | Bring a nutrient solution into range using acid or base. | chemistry/ph-test |
| chemistry/ph-test | Measure Solution pH | Use pH strips to check solution acidity while wearing protective gear. | chemistry/safe-reaction |
| chemistry/precipitation-reaction | Form a Precipitate | Mix two solutions until a solid appears. | chemistry/ph-test |
| chemistry/safe-reaction | Demonstrate a Safe Chemical Reaction | Phoenix walks you through a harmless experiment that introduces eco-friendly propellant basics. | welcome/howtodoquests |
| chemistry/stevia-crystals | Refine Stevia Crystals | Purify your extract into concentrated crystals | chemistry/stevia-extraction |
| chemistry/stevia-extraction | Extract Stevia Sweetener | Use simple chemistry to make a sweet extract from stevia leaves. | hydroponics/stevia<br>chemistry/safe-reaction |
| chemistry/stevia-tasting | Taste Test Stevia Crystals | Evaluate the sweetness of your freshly made stevia crystals. | chemistry/stevia-crystals |

## completionist
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| completionist/catalog | Catalog Your Trophy | Log your Completionist Award II so you never misplace it. | completionist/v2 |
| completionist/display | Show Off Your Trophy | Give your Completionist Award II a dedicated spot on the shelf. | completionist/v2 |
| completionist/polish | Polish Your Trophy | Keep your Completionist Award II shiny and proud. | completionist/v2 |
| completionist/reminder | Check for New Quests | Return regularly to see what fresh challenges await you. | completionist/v2 |
| completionist/v2 | Congrats for finishing all the quests!! | Here's a trophy for your efforts! | welcome/howtodoquests<br>ubi/basicincome<br>3dprinter/start<br>aquaria/water-testing<br>energy/solar-1kWh<br>rocketry/parachute<br>hydroponics/basil |

## composting
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| composting/check-temperature | Check Compost Temperature | Measure the heat of your compost to ensure active decomposition. | composting/start |
| composting/sift-compost | Sift Finished Compost | Screen compost to remove large chunks for a fine finished mix. | composting/turn-pile |
| composting/start | Start a Compost Bucket | Begin recycling kitchen scraps into soil. | welcome/howtodoquests |
| composting/turn-pile | Turn Your Compost Bucket | Aerate the compost by stirring the mix so microbes stay active. | composting/start |

## devops
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| devops/auto-updates | Enable Automatic Updates | Keep your Pi cluster secure with unattended upgrades. | devops/monitoring |
| devops/ci-pipeline | Set Up a CI Pipeline | Configure GitHub Actions to run tests whenever you push. | devops/docker-compose |
| devops/daily-backups | Configure Daily Backups | Use a cron job to archive your game data each night. | devops/monitoring |
| devops/docker-compose | Launch DSPACE in Docker | Start DSPACE with Docker Compose and expose it securely through a Cloudflare Tunnel. | devops/prepare-first-node |
| devops/enable-https | Secure the Cluster with HTTPS | Use Let's Encrypt to add TLS encryption to your services. | devops/daily-backups |
| devops/fail2ban | Block SSH Brute Force | Install Fail2ban to ban repeated failed logins. | devops/ssh-hardening |
| devops/firewall-rules | Configure Firewall Rules | Lock down network ports to only what you need. | devops/auto-updates |
| devops/k3s-deploy | Deploy with k3s | Orion teaches you how to run DSPACE across multiple Pis with k3s. | devops/docker-compose |
| devops/log-maintenance | Set Up Log Rotation | Prevent logs from filling your server by compressing old files. | devops/daily-backups |
| devops/monitoring | Set Up Monitoring | Install Prometheus and Grafana to monitor your Pi cluster. | devops/k3s-deploy |
| devops/pi-cluster-hardware | Plan Your Pi Cluster | Orion lists the parts needed to build a Raspberry Pi cluster. | sysadmin/basic-commands |
| devops/prepare-first-node | Prepare the First Node | Flash the OS and install Docker under Orion's guidance. | devops/pi-cluster-hardware |
| devops/private-registry | Run a Private Docker Registry | Host your own Docker images on the cluster. | devops/docker-compose |
| devops/ssd-boot | Boot from SSD | Clone the OS to an SSD and enable M.2 boot. | devops/prepare-first-node |
| devops/ssh-hardening | Harden SSH Access | Use key-based authentication and disable password logins. | devops/firewall-rules |

## electronics
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| electronics/arduino-blink | Blink an LED with Arduino | Learn to program a microcontroller by blinking an LED. | electronics/basic-circuit |
| electronics/basic-circuit | Build a basic LED circuit | Wire a 5 mm LED and 220 Ω resistor on a breadboard to learn basic circuits. | welcome/howtodoquests |
| electronics/check-battery-voltage | Check a battery pack's voltage | Use a digital multimeter to check a 12 V LiFePO4 battery pack after disconnecting it and placing it on a dry, non-conductive surface. Wear safety goggles throughout. | electronics/basic-circuit |
| electronics/continuity-test | Check USB cable continuity | Use a digital multimeter in continuity mode to check an unplugged USB cable while wearing safety goggles. | electronics/solder-wire |
| electronics/data-logger | Log Temperature Data | Use a Raspberry Pi to record readings from your thermistor. | electronics/thermistor-reading |
| electronics/desolder-component | Desolder a component | Remove a through-hole resistor from a scrap PCB using a desoldering pump, flux pen and solder wick. Work in a ventilated area and wear safety goggles. | electronics/solder-wire |
| electronics/led-polarity | Check LED polarity with a multimeter | Use a digital multimeter's diode mode to find which lead of a loose 5 mm LED is positive. Disconnect power, work on a dry non-conductive surface, wear safety goggles, and only use the meter's built-in diode test. | electronics/check-battery-voltage |
| electronics/light-sensor | Build a Light Sensor | Use a photoresistor and Arduino to measure ambient brightness. | electronics/basic-circuit |
| electronics/measure-arduino-5v | Measure Arduino 5 V output | Verify the 5 V pin on an Arduino Uno with a multimeter. | electronics/arduino-blink |
| electronics/measure-led-current | Measure LED Current | Use a digital multimeter to measure the current through a basic LED circuit. | electronics/basic-circuit |
| electronics/measure-resistance | Measure a Resistor | Use a digital multimeter to confirm a loose resistor's value. Disconnect all power, keep metal jewelry off, set components on a dry non-conductive surface, and wear safety goggles. | electronics/resistor-color-check |
| electronics/potentiometer-dimmer | Dim an LED with a Potentiometer | Adjust LED brightness using a potentiometer and an Arduino. | electronics/arduino-blink |
| electronics/resistor-color-check | Verify resistor color bands | Confirm a resistor's value by decoding its color bands before installing it in a circuit. | electronics/basic-circuit |
| electronics/servo-sweep | Sweep a Servo | Use the Arduino IDE's Servo library 'Sweep' example to rotate a hobby servo from 0° to 180°. | electronics/arduino-blink |
| electronics/solder-led-harness | Solder an LED Harness | Join a 5 mm LED and 220 Ω resistor to two jumper wires using a soldering iron kit. Ventilate and wear safety goggles. | electronics/tin-soldering-iron |
| electronics/solder-wire | Solder a Wire Connection | Join jumper wires with a soldering kit, heat-shrink tubing, and a heat gun. Keep a brass tip cleaner handy, ventilate, and wear safety goggles. | electronics/tin-soldering-iron |
| electronics/temperature-plot | Plot Temperature Data | Generate a chart from your thermistor log using Python. | electronics/data-logger |
| electronics/test-gfci-outlet | Test a GFCI Outlet | Verify a ground-fault circuit interrupter outlet with a plug-in tester. | electronics/continuity-test |
| electronics/thermistor-reading | Read a Thermistor | Wire a thermistor to your Arduino and log temperature values. | electronics/potentiometer-dimmer |
| electronics/thermometer-calibration | Calibrate a Thermometer | Use water baths to verify your thermometer's accuracy. | electronics/thermistor-reading |
| electronics/tin-soldering-iron | Tin a Soldering Iron | Prepare your soldering iron for clean joints by tinning the tip. | electronics/basic-circuit |
| electronics/voltage-divider | Build a Voltage Divider | Split 5 V to about 2.5 V using 220 Ω and 10 kΩ resistors on a Breadboard. | electronics/basic-circuit |

## energy
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| energy/battery-maintenance | Maintain Your Battery Pack | Cycle your 200 Wh battery pack with solar to keep it healthy. | energy/solar |
| energy/battery-upgrade | Install a Larger Battery | Expand your solar setup with a 1 kWh storage pack and enclosure. | energy/solar |
| energy/biogas-digester | Build a Biogas Digester | Ferment kitchen scraps into methane for cooking. | energy/solar-1kWh |
| energy/charge-controller-setup | Configure a Solar Charge Controller | Wire and configure a charge controller to safely charge your 200 Wh battery. | energy/solar |
| energy/dSolar-100kW | Accrue 100,000 dSolar | Set new standards in solar energy production! To complete this quest, have at least 100,000 dSolar in your inventory. | energy/dSolar-10kW |
| energy/dSolar-10kW | Accrue 10,000 dSolar | Push the boundaries of energy production! To complete this quest, have at least 10,000 dSolar in your inventory. | energy/dSolar-1kW |
| energy/dSolar-1kW | Accrue 1,000 dSolar | Reach increasingly higher levels of energy production! To complete this quest, have at least 1,000 dSolar in your inventory. | energy/solar-1kWh |
| energy/dWatt-1e3 | Accumulate 1,000 dWatt | Boost your energy potential! To unlock this quest's reward, accumulate at least 1,000 dWatt in your inventory. | energy/solar |
| energy/dWatt-1e4 | Accumulate 10,000 dWatt | Supercharge your energy reserves! To claim your prize, gather at least 10,000 dWatt in your inventory. | energy/dWatt-1e3 |
| energy/dWatt-1e5 | Collect a Stunning 100,000 dWatt | Ascent to greater heights in energy collection! To be rewarded, amass a significant 100,000 dWatt. | energy/dWatt-1e4 |
| energy/dWatt-1e6 | Achieve an Astounding 1,000,000 dWatt | Reach the pinnacle of energy gathering! Secure your legacy by accumulating 1,000,000 dWatt. | energy/dWatt-1e4 |
| energy/dWatt-1e7 | Amass an Unbelievable 10,000,000 dWatt | Challenge the very fabric of what's considered possible! Conquer this monumental task by stockpiling 10,000,000 dWatt. | energy/dWatt-1e5 |
| energy/dWatt-1e8 | Store a Colossal 100,000,000 dWatt | Prove your dedication by collecting a staggering 100,000,000 dWatt. | energy/dWatt-1e7 |
| energy/hand-crank-generator | Build a Hand Crank Generator | Print parts and assemble a hand crank generator to charge a 200 Wh battery pack. | energy/solar |
| energy/offgrid-charger | Charge a Device Off-Grid | Charge a phone off-grid with a 200 W panel, charge controller, 200 Wh LiFePO4 battery and USB cable. | energy/solar |
| energy/portable-solar-panel | Test a Portable Solar Panel | Harvest sunshine anywhere with a foldable panel. | energy/solar |
| energy/power-inverter | Install a Power Inverter | Convert your battery's DC output into AC for household gear. | energy/battery-upgrade |
| energy/solar | Set up a solar panel | The wall outlet is convenient, but your utility uses fossil fuels for electricity generation! Let's take things in our own hands and start going off the grid. | welcome/howtodoquests |
| energy/solar-1kWh | Upgrade your solar enclosure with more capacity | Swap out that tiny 200 Wh battery pack for a new 1 kWh one! No upgrade in charge speed just yet, just more capacity! | energy/solar |
| energy/solar-tracker | Build a Solar Tracker | Rotate your 200 Wh kit to follow the sun. | energy/solar |
| energy/wind-turbine | Install a Wind Turbine | Supplement your solar setup with power from the breeze. | energy/solar-1kWh |

## firstaid
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| firstaid/assemble-kit | Assemble a First Aid Kit | Assemble a basic first aid kit so you're ready for minor injuries. | welcome/howtodoquests |
| firstaid/change-bandage | Change a Bandage | Swap an old bandage for a fresh one to keep a minor cut clean. | firstaid/wound-care |
| firstaid/dispose-bandages | Bag Used Bandages | Use a biohazard bag to discard used bandages and wash up. | firstaid/change-bandage |
| firstaid/dispose-expired | Dispose Expired First Aid Supplies | Clear out old items so your first aid kit stays reliable. | firstaid/restock-kit |
| firstaid/flashlight-battery | Check Flashlight Battery | Measure your emergency flashlight's 9 V battery with a digital multimeter. | firstaid/assemble-kit |
| firstaid/learn-cpr | Practice Basic CPR | Practice 30:2 compressions on a CPR manikin using nitrile gloves, a pocket mask and antiseptic wipes from your first aid kit. Confirm the area is safe, call emergency services first and sanitize gear after. This exercise does not replace formal certification. | firstaid/assemble-kit |
| firstaid/remove-splinter | Remove a Splinter | Take out a small splinter to prevent infection. | firstaid/wound-care |
| firstaid/restock-kit | Restock Your First Aid Kit | Replace used supplies so you're ready for emergencies. | firstaid/assemble-kit |
| firstaid/sanitize-pocket-mask | Sanitize Your CPR Pocket Mask | Clean and disinfect your CPR mask so it's safe for the next emergency. | firstaid/learn-cpr |
| firstaid/splint-limb | Splint a Minor Fracture | Practice immobilizing a minor limb injury with supplies from a first aid kit. Only attempt this on stable injuries and call emergency services for serious fractures. | firstaid/wound-care |
| firstaid/stop-nosebleed | Stop a Nosebleed | Sit upright, lean forward, and pinch the soft part of your nose with a sterile gauze pad. Wear nitrile gloves from a first aid kit, use an antiseptic wipe around your nostrils after bleeding slows, and keep your head tilted forward the whole time. Never tilt your head back or insert anything into the nostrils. | firstaid/assemble-kit |
| firstaid/treat-burn | Treat a Minor Burn | Cool and dress a small burn so it heals cleanly. | firstaid/assemble-kit |
| firstaid/wound-care | Practice Basic Wound Care | Practice cleaning a minor cut with soap, gloves, an antiseptic wipe, antibiotic ointment and a bandage. | firstaid/learn-cpr |

## geothermal
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| geothermal/backflush-loop-filter | Backflush Loop Filter | Use a submersible pump to rinse debris from the geothermal loop filter. | geothermal/purge-loop-air |
| geothermal/calibrate-ground-sensor | Calibrate Ground Sensor | Use ice and boiling water to calibrate your thermistor before burying it. | geothermal/survey-ground-temperature |
| geothermal/check-loop-inlet-temp | Check Loop Inlet Temperature | Use an Arduino to log the water temperature entering the heat pump. | geothermal/survey-ground-temperature |
| geothermal/check-loop-outlet-temp | Check Loop Outlet Temperature | Log the water temperature leaving the heat pump with an Arduino thermistor. | geothermal/check-loop-inlet-temp |
| geothermal/check-loop-pressure | Check Loop Pressure | Verify the ground loop is holding pressure with a quick gauge check. | geothermal/survey-ground-temperature |
| geothermal/check-loop-temp-delta | Check Loop Temperature Delta | Use two thermistors with an Arduino to compare loop inlet and outlet temps. | geothermal/check-loop-inlet-temp<br>geothermal/check-loop-outlet-temp |
| geothermal/compare-depth-ground-temps | Compare Depth Ground Temps | Bury two thermistors at different depths and log their readings for a day. | geothermal/log-ground-temperature |
| geothermal/compare-seasonal-ground-temps | Compare Seasonal Ground Temps | Use a second thermistor to log ground temperatures in different seasons. | geothermal/log-ground-temperature |
| geothermal/install-backup-thermistor | Install Backup Thermistor | Add a second probe so you can cross-check ground temperature readings. | geothermal/calibrate-ground-sensor |
| geothermal/log-ground-temperature | Log Ground Temperature | Use a buried thermistor with Arduino to monitor ground temperature over time. | geothermal/survey-ground-temperature |
| geothermal/log-heat-pump-warmup | Log Heat Pump Warmup | Track how quickly the loop temperature rises after startup. | geothermal/log-ground-temperature |
| geothermal/monitor-heat-pump-energy | Monitor Heat Pump Energy Use | Install a smart plug to track how much power your ground loop consumes. | geothermal/survey-ground-temperature |
| geothermal/purge-loop-air | Purge Air from Ground Loop | Use a submersible pump to flush out trapped bubbles from your geothermal loop. | geothermal/survey-ground-temperature |
| geothermal/replace-faulty-thermistor | Replace Faulty Thermistor | Swap out a dead probe and verify readings stay true. | geothermal/install-backup-thermistor |
| geothermal/survey-ground-temperature | Survey for Geothermal Heat | Measure the ground temperature to see if a heat pump will work. | energy/solar |

## hydroponics
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| hydroponics/air-stone-soak | Soak Air Stone | Prime the air stone so bubbles stay even. | hydroponics/filter-clean |
| hydroponics/basil | Grow basil hydroponically | Learn how to grow plants without soil! | welcome/howtodoquests |
| hydroponics/bucket_10 | Bucket, we'll do it live! | Have 10 buckets of dechlorinated water in your inventory. For some reason. | hydroponics/basil<br>3dprinter/start |
| hydroponics/ec-calibrate | Calibrate EC Meter | Use calibration solution so readings stay accurate. | hydroponics/ph-check |
| hydroponics/ec-check | Check Solution EC | Measure nutrient strength with an EC meter. | hydroponics/ec-calibrate |
| hydroponics/filter-clean | Rinse Grow Bed Filter | Clear out the gunk so the roots can breathe. | hydroponics/top-off |
| hydroponics/grow-light | Install a Grow Light | Mount a full-spectrum LED grow lamp and automate a 12 h light cycle with a smart plug and timer. | hydroponics/bucket_10 |
| hydroponics/lettuce | Grow Lettuce Hydroponically | Plant lettuce seeds and harvest fresh leaves using your hydroponic setup. | hydroponics/basil |
| hydroponics/mint-cutting | Clone Mint Cutting | Root a mint sprig for endless tea. | hydroponics/plug-soak |
| hydroponics/netcup-clean | Clean Net Cups | Sanitize net cups to keep roots disease-free. | hydroponics/tub-scrub |
| hydroponics/nutrient-check | Refresh Nutrient Solution | Top off your hydroponic tub with fresh nutrients while keeping yourself and the plants safe. | hydroponics/basil |
| hydroponics/ph-check | Check Solution pH | Measure the nutrient bath's pH and correct it to keep plants happy. | hydroponics/nutrient-check |
| hydroponics/ph-test | Test Hydroponic pH | Check acidity so your plants stay healthy. | hydroponics/nutrient-check |
| hydroponics/plug-soak | Soak Starter Plugs | Hydrate rockwool cubes so seeds sprout happily. | hydroponics/top-off |
| hydroponics/pump-install | Install Submersible Pump | Add circulation to keep nutrients moving. | hydroponics/reservoir-refresh |
| hydroponics/pump-prime | Prime Water Pump | Prep the pump so it doesn't run dry. | hydroponics/pump-install |
| hydroponics/regrow-stevia | Regrow Your Stevia | Hydro shows you how to coax another harvest from trimmed plants. | hydroponics/stevia |
| hydroponics/reservoir-refresh | Refresh the Reservoir | Swap out old nutrient solution for a fresh batch. | hydroponics/basil |
| hydroponics/root-rinse | Rinse the Roots | Flush salts from the root zone with clean water. | hydroponics/filter-clean |
| hydroponics/stevia | Grow Stevia Hydroponically | Cultivate stevia plants for a natural sweetener. | hydroponics/lettuce |
| hydroponics/temp-check | Check Water Temperature | Make sure the reservoir stays in the sweet spot. | hydroponics/nutrient-check |
| hydroponics/top-off | Top Off the Reservoir | Add fresh water to keep nutrient levels stable. | hydroponics/pump-install |
| hydroponics/tub-scrub | Scrub the Grow Tub | Remove biofilm from the reservoir walls. | hydroponics/reservoir-refresh |

## programming
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| programming/avg-temp | Compute Average Temperature | Write a small script that reads your log file and prints the daily average temperature. | programming/temp-logger |
| programming/graph-temp | Graph Temperature Logs | Plot the raw log from temp-logger to get a quick visual check that your sensor data looks reasonable. | programming/temp-logger |
| programming/graph-temp-data | Clean and graph your temperature logs | Parse your log file, smooth noisy readings, and annotate the highs and lows so the chart tells a clearer story than raw numbers alone. | programming/graph-temp |
| programming/hello-sensor | Log Temperature Data | dChat shows you how a short script can capture sensor information for later analysis. | electronics/arduino-blink |
| programming/http-post | Accept POST Data | Update your server to handle POST requests and log JSON payloads. | programming/json-api |
| programming/json-api | Serve JSON Data | Extend your server to respond with structured JSON. | programming/web-server |
| programming/json-endpoint | Serve JSON Data | Extend your server to respond with structured JSON. | programming/web-server |
| programming/median-temp | Compute Median Temperature | Extend your script to report the median temperature from your log. | programming/avg-temp |
| programming/moving-avg-temp | Compute Moving Average Temperature | Add a moving average to your temperature analysis script. | programming/avg-temp |
| programming/plot-temp-cli | Plot Temperature Data via CLI | Use Python to turn your temperature log into a line chart. | programming/temp-logger |
| programming/stddev-temp | Compute Temperature Standard Deviation | Extend your script to report the standard deviation of daily temperature readings. | programming/median-temp |
| programming/temp-alert | Set Temperature Alert | Write a script that warns you when the sensor crosses a threshold. | programming/temp-graph |
| programming/temp-email | Email Temperature Alert | Trigger an email when the sensor exceeds a set temperature. | programming/temp-alert |
| programming/temp-graph | Serve a live temperature graph | Host a simple web page that fetches your JSON endpoint and renders an auto-refreshing temperature chart. | programming/graph-temp-data<br>programming/temp-json-api |
| programming/temp-json-api | Serve Temperature as JSON | Expose the latest sensor reading at a JSON endpoint. | programming/json-api |
| programming/temp-logger | Log Temperature Data | Write a simple script that records hourly temperature readings. | electronics/thermistor-reading |
| programming/thermistor-calibration | Calibrate a Thermistor | Use a 10k thermistor to measure temperature accurately with an Arduino script. | programming/hello-sensor |
| programming/web-server | Serve a Web Page | Write a tiny HTTP server that responds with 'Hello, world'. | programming/hello-sensor |

## robotics
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| robotics/gyro-balance | Balance with a gyroscope | Pair a gyro with tuned servo control so a two-wheeled platform can catch itself before tipping over. | robotics/odometry-basics |
| robotics/line-follower | Build a line-following robot | Train a two-wheel bot to read line sensors and stay on a taped track while you tune the code. | robotics/servo-control<br>robotics/reflectance-sensors |
| robotics/maze-navigation | Navigate a Simple Maze | Layer line following, distance sensing, and encoder feedback to clear a taped maze without getting lost. | robotics/obstacle-avoidance<br>robotics/odometry-basics |
| robotics/obstacle-avoidance | Add Obstacle Avoidance | Give your line follower the awareness to pause, scan, and steer around boxes without leaving the track. | robotics/line-follower<br>robotics/ultrasonic-rangefinder |
| robotics/odometry-basics | Track distance with wheel encoders | Convert encoder ticks into centimeters traveled so navigation code can estimate position between sensor readings. | robotics/wheel-encoders |
| robotics/pan-tilt | Make a Pan-Tilt Mount | Build a two-axis mount so cameras or sensors can pan and tilt to survey the space around your robot. | robotics/servo-control |
| robotics/reflectance-sensors | Calibrate reflectance sensors | Dial in IR reflectance sensors so your robot can tell a dark line from the floor before you attempt closed-loop control. | electronics/light-sensor<br>programming/hello-sensor |
| robotics/servo-arm | Assemble a Servo Arm | Assemble a two-joint servo arm with a gripper so you can practice smooth pick-and-place moves. | robotics/servo-gripper |
| robotics/servo-control | Control a Servo Motor | Wire a hobby servo to your Arduino and use the Sweep example to understand position control. | electronics/arduino-blink |
| robotics/servo-gripper | Build a Servo Gripper | Cut and hinge two jaws onto a micro servo so your robot can pinch and release small objects safely. | robotics/servo-control |
| robotics/servo-radar | Scan with a servo-mounted sensor | Combine a pan-tilt mount and ultrasonic sensor to sweep the room and build a quick proximity map. | robotics/pan-tilt<br>robotics/ultrasonic-rangefinder |
| robotics/ultrasonic-rangefinder | Measure distance with an ultrasonic sensor | Wire and test an HC-SR04 so your Arduino can report clear distance readings for navigation code. | electronics/arduino-blink |
| robotics/wheel-encoders | Add Wheel Encoders | Install wheel encoders so your robot can measure distance, hold headings, and repeat paths reliably. | robotics/servo-control |

## rocketry
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| rocketry/firstlaunch | First rocket launch! | Print and launch your own model rocket. Follow the steps to print, assemble, and launch the rocket. Get ready for liftoff! | 3dprinter/start |
| rocketry/fuel-mixture | Fuel Mixture Calibration | Dial in a safe oxidizer-to-fuel ratio for a hobbyist model rocket before launch. | rocketry/firstlaunch |
| rocketry/guided-rocket-build | Build a Guided Model Rocket | Print a servo-ready fincan, assemble the avionics, and program guidance for a camera-equipped hop. | rocketry/firstlaunch<br>rocketry/parachute<br>rocketry/preflight-check |
| rocketry/night-launch | Night Launch | Take your rocket experience to the stars with a night launch. Gather your gear and light up the sky. | rocketry/recovery-run |
| rocketry/parachute | Add a parachute | Upgrade your rocket with a nylon parachute for gentle landings and possible reuse. | rocketry/firstlaunch |
| rocketry/preflight-check | Preflight Checklist | Confirm gear and run a quick launch sequence. | rocketry/firstlaunch |
| rocketry/recovery-run | Practice Rocket Recovery | Launch with a parachute and retrieve the rocket intact. | rocketry/parachute |
| rocketry/static-test | Perform a Static Engine Test | Fire your rocket engine while it's secured to verify thrust and stability. | rocketry/parachute |
| rocketry/suborbital-hop | Guided Model Rocket Hop | Run the guided hop simulator, prep the range, and fly a servo-stabilized model rocket with onboard video. | rocketry/recovery-run<br>rocketry/preflight-check<br>rocketry/guided-rocket-build |
| rocketry/wind-check | Check the Launch Winds | Measure wind speed to ensure safe rocket launches. | rocketry/preflight-check |

## sysadmin
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| sysadmin/basic-commands | Learn Basic Linux Commands | Practice core shell commands on an Ubuntu 24.04 LTS Minimal server. | welcome/howtodoquests |
| sysadmin/log-analysis | Inspect System Logs | Use journalctl and tail to spot issues on Ubuntu 24.04 LTS Minimal. | sysadmin/resource-monitoring |
| sysadmin/resource-monitoring | Monitor System Resources | Track CPU, memory, and disk on Ubuntu 24.04 LTS Minimal using top and df. | sysadmin/basic-commands |

## ubi
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| ubi/basicincome | Earn basic income | Learn about the basic income system and how to earn dUSD. | 3dprinter/start |
| ubi/first-payment | Claim Your First UBI | Withdraw your daily dUSD for the first time. | ubi/basicincome |
| ubi/reminder | Set a UBI Reminder | Schedule a daily reminder so you never miss your dUSD payout. | ubi/first-payment |
| ubi/savings-goal | Start a Savings Jar | Set aside some dUSD for future plans. | ubi/first-payment |

## welcome
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| welcome/connect-github | Connect GitHub | Link your GitHub account to enable cloud sync and quest submissions. | welcome/howtodoquests |
| welcome/howtodoquests | How to do quests | Learn how quest mechanics work, including dialogue choices, real items, and safe processes. | None |
| welcome/intro-inventory | Check Your Inventory | Learn how to view items you've collected so far. | welcome/howtodoquests |
| welcome/run-tests | Run the Test Suite | Learn how to run DSPACE's automated tests to ensure your changes are correct. | welcome/howtodoquests |
| welcome/smart-plug-test | Smart Plug Test | Use a smart plug to buy 1 kWh from a wall outlet and mint 1,000 dWatt tokens. | welcome/howtodoquests |

## woodworking
| Quest | Title | Description | Requires |
| --- | --- | --- | --- |
| woodworking/apply-finish | Apply a Wood Finish | Brush on a thin protective finish that resists moisture and highlights the grain you just sanded smooth. | woodworking/finish-sanding |
| woodworking/birdhouse | Build a birdhouse | Start woodworking with a straightforward birdhouse that teaches measuring, safe cuts, and clean glue joints. | woodworking/planter-box |
| woodworking/bookshelf | Build a small bookshelf | Apply your skills to assemble a functional bookshelf. | woodworking/step-stool |
| woodworking/coffee-table | Build a coffee table | Craft a low table to anchor your living space. | woodworking/bookshelf |
| woodworking/finish-sanding | Finish Sand Your Project | Smooth the surface of your latest build with fine-grit paper before applying finish. | woodworking/step-stool |
| woodworking/picture-frame | Craft a Picture Frame | Make a simple frame to showcase your favorite photo. | woodworking/tool-rack |
| woodworking/planter-box | Build a Planter Box | Cut and nail a cedar planter box that introduces square joints and waterproof glue-ups. | welcome/howtodoquests |
| woodworking/step-stool | Build a step stool | Build a sturdy pine step stool and practice safe cutting and gluing. | woodworking/birdhouse<br>woodworking/planter-box |
| woodworking/tool-rack | Build a Tool Rack | Organize your workspace with a simple rack for hand tools. | woodworking/workbench |
| woodworking/workbench | Build a simple workbench | Upgrade from a makeshift surface to a level, clamped-together workbench that can handle real projects. | woodworking/step-stool |

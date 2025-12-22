# Quest Tree

This document lists every quest with its description and prerequisites, grouped by quest path. Indentation reflects intra-path prerequisites; cross-path requirements are shown inline.

## 3dprinter

- **Set up your first 3D printer** (`3dprinter/start`): Accept Sydney's offer of a 3D printer, and learn how to set it up for use in your space exploration adventure. _Prerequisites:_ `welcome/howtodoquests`.

## 3dprinting

- **3D Print 10 Benchies** (`3dprinting/benchy_10`): Put your 3D printer to the test! To complete this quest, print at least 10 Benchies. _Prerequisites:_ `3dprinter/start`.
- **Clear a Clogged Nozzle** (`3dprinting/nozzle-cleaning`): Heat and clean the nozzle to restore smooth extrusion. _Prerequisites:_ `3dprinter/start`.
- **Level the Print Bed** (`3dprinting/bed-leveling`): After power-off and cooling, level the FDM bed with a sheet of printer paper. _Prerequisites:_ `3dprinter/start`.
- **Print a Cable Clip** (`3dprinting/cable-clip`): Reduce clutter by 3D printing a simple cable clip. _Prerequisites:_ `3dprinter/start`.
- **Print a Calibration Cube** (`3dprinting/calibration-cube`): Print and measure a 20 mm calibration cube to verify your printer's accuracy. _Prerequisites:_ `3dprinter/start`.
- **Print a Phone Stand** (`3dprinting/phone-stand`): Practice 3D printing by making a handy phone stand. _Prerequisites:_ `3dprinter/start`.
- **Print a Spool Holder** (`3dprinting/spool-holder`): Keep filament tidy by printing a simple spool holder. _Prerequisites:_ `3dprinter/start`.
- **Swap Filament** (`3dprinting/filament-change`): Swap to green PLA on your entry-level FDM printer with goggles, wire cutters, and a 10 g purge. _Prerequisites:_ `3dprinter/start`.
- **Tighten the X-axis Belt** (`3dprinting/x-belt-tension`): Keep your prints sharp by safely tightening a loose X-axis belt. _Prerequisites:_ `3dprinter/start`.
- **Witness a Blob of Death** (`3dprinting/blob-of-death`): Skipping a first-layer check lets a failed Z homing extrude in mid-air, engulfing the nozzle in molten plastic. _Prerequisites:_ `3dprinter/start`.
  - **3D Print 25 Benchies** (`3dprinting/benchy_25`): Increase your 3D printing output! To complete this quest, print at least 25 Benchies. _Prerequisites:_ `3dprinting/benchy_10`.
  - **Fix a Clogged Nozzle** (`3dprinting/nozzle-clog`): Disassemble your printer after a blob of death from skipping the first layer to unclog or replace the nozzle. _Prerequisites:_ `3dprinter/start`, `3dprinting/blob-of-death`.
  - **Tune Retraction Settings** (`3dprinting/retraction-test`): Print a single Benchy while adjusting retraction to reduce stringing. _Prerequisites:_ `3dprinting/phone-stand`.
    - **3D Print 100 Benchies** (`3dprinting/benchy_100`): Show off your 3D printing prowess! To complete this quest, print at least 100 Benchies. _Prerequisites:_ `3dprinting/benchy_25`.
    - **Print a Temperature Tower** (`3dprinting/temperature-tower`): Find the ideal nozzle temperature by printing a simple calibration tower. _Prerequisites:_ `3dprinting/retraction-test`.

## aquaria

- **Set up a Walstad tank** (`aquaria/walstad`): Create a low-tech planted aquarium using the Walstad method. _Prerequisites:_ `welcome/howtodoquests`.
  - **Move the Walstad tank** (`aquaria/position-tank`): Atlas helps you lift the empty 80 L Walstad aquarium onto a sturdy stand. Clear the path, lift with your legs and keep the glass supported. _Prerequisites:_ `aquaria/walstad`.
    - **Attach Aquarium Thermometer** (`aquaria/thermometer`): Attach a stick-on strip thermometer outside the aquarium glass to monitor water temperature. _Prerequisites:_ `aquaria/position-tank`.
    - **Install a sponge filter** (`aquaria/sponge-filter`): Add gentle filtration to keep your tank clean without harming shrimp. _Prerequisites:_ `aquaria/position-tank`.
      - **Install an aquarium heater** (`aquaria/heater-install`): Install a 150 W heater in a Walstad tank and verify 26°C with a stick-on thermometer. _Prerequisites:_ `aquaria/sponge-filter`, `aquaria/thermometer`.
      - **Install an aquarium light** (`aquaria/aquarium-light`): Add LED lighting to support plant growth and fish health. _Prerequisites:_ `aquaria/sponge-filter`.
      - **Rinse Sponge Filter** (`aquaria/filter-rinse`): Unplug air pump. Rinse sponge filter in dechlorinated water to restore flow and protect bacteria. _Prerequisites:_ `aquaria/sponge-filter`.
      - **Test water parameters** (`aquaria/water-testing`): Use the Aquarium liquid test kit to check ammonia, nitrite and nitrate before adding shrimp. Put on nitrile gloves and safety goggles, work in a ventilated area and discard reagents per the kit manual. _Prerequisites:_ `aquaria/thermometer`.
        - **Add guppies** (`aquaria/guppy`): Introduce colorful guppies to your community tank. _Prerequisites:_ `aquaria/water-testing`, `aquaria/heater-install`.
        - **Check aquarium pH** (`aquaria/ph-strip-test`): Use a disposable strip to confirm your tank's pH. _Prerequisites:_ `aquaria/water-testing`.
        - **Log Water Parameters** (`aquaria/log-water-parameters`): Use a liquid test kit and logbook to track ammonia, nitrite, nitrate and pH. Wear nitrile gloves. _Prerequisites:_ `aquaria/water-testing`.
          - **Add dwarf shrimp** (`aquaria/shrimp`): Introduce hardy shrimp with drip acclimation to keep the tank clean and water stable. _Prerequisites:_ `aquaria/water-testing`, `aquaria/heater-install`, `aquaria/log-water-parameters`.
          - **Balance aquarium pH** (`aquaria/balance-ph`): Use buffer solution to adjust tank pH and confirm stability. _Prerequisites:_ `aquaria/ph-strip-test`.
          - **Breed your guppies** (`aquaria/breeding`): Raise the next generation of fish among dense plants. _Prerequisites:_ `aquaria/guppy`.
          - **Perform a partial water change** (`aquaria/water-change`): Swap out a quarter of the tank water for conditioned tap water to keep fish healthy. _Prerequisites:_ `aquaria/guppy`.
            - **Add Floating Plants** (`aquaria/floating-plants`): Introduce guppy grass to help balance nutrients in your tank. _Prerequisites:_ `aquaria/shrimp`.
            - **Catch a fish with a net** (`aquaria/net-fish`): Use an aquarium net to move a fish safely during cleaning. _Prerequisites:_ `aquaria/water-change`.
            - **Set up an aquarium for a goldfish** (`aquaria/goldfish`): Goldfish need a fairly large aquarium to be happy, but they're easy to raise. _Prerequisites:_ `welcome/howtodoquests`, `aquaria/breeding`.
            - **Top Off Evaporated Water** (`aquaria/top-off`): Use a hand pump siphon and aged water to restore aquarium levels. _Prerequisites:_ `aquaria/water-change`.

## astronomy

- **Observe the Moon** (`astronomy/observe-moon`): Use a basic telescope, mission logbook, quill, ink and red flashlight to sketch lunar craters safely. _Prerequisites:_ `welcome/howtodoquests`.
  - **Assemble a Simple Telescope** (`astronomy/basic-telescope`): Use 50 mm and 20 mm magnifying lenses, masking tape, a cardboard mailing tube and a camera tripod to build a simple refractor for viewing Jupiter's moons. Work in the shade and never aim at the Sun. _Prerequisites:_ `astronomy/observe-moon`.
  - **Photograph a Lunar Eclipse** (`astronomy/lunar-eclipse`): Capture images of the Moon as it moves through Earth's shadow. _Prerequisites:_ `astronomy/observe-moon`.
  - **Spot the ISS** (`astronomy/iss-flyover`): Use a satellite-tracking app on your smartphone and a basic telescope to watch the International Space Station pass overhead and log the time in your mission logbook. _Prerequisites:_ `astronomy/observe-moon`.
    - **Locate the Andromeda Galaxy** (`astronomy/andromeda`): Use a planisphere star chart, a red flashlight and a basic telescope to locate our neighboring galaxy while preserving night vision. _Prerequisites:_ `astronomy/basic-telescope`.
    - **Photograph the ISS** (`astronomy/iss-photo`): Use a tracking app and tripod phone to capture the ISS streak and log it. _Prerequisites:_ `astronomy/iss-flyover`.
    - **Sketch Sunspots** (`astronomy/sunspot-sketch`): Project the Sun onto paper with a basic telescope and sketch sunspots in your mission logbook without looking through the eyepiece. _Prerequisites:_ `astronomy/basic-telescope`.
    - **Spot Saturn's Rings** (`astronomy/saturn-rings`): Use a planisphere and your basic telescope to find Saturn and resolve its rings. _Prerequisites:_ `astronomy/basic-telescope`.
    - **Track Jupiter's Moons** (`astronomy/jupiter-moons`): Observe the four largest moons nightly to understand orbital motion. _Prerequisites:_ `astronomy/basic-telescope`.
      - **Document a Meteor Shower** (`astronomy/meteor-shower`): Track meteors during a peak shower using a basic telescope, planisphere, red flashlight and mission logbook. _Prerequisites:_ `astronomy/jupiter-moons`.
      - **Map the Constellations** (`astronomy/constellations`): Identify key star patterns to aid celestial navigation. _Prerequisites:_ `astronomy/jupiter-moons`.
      - **Observe the Orion Nebula** (`astronomy/orion-nebula`): Use a planisphere, red flashlight and basic telescope to find the Orion Nebula. _Prerequisites:_ `astronomy/andromeda`.
      - **Observe Venus's Phases** (`astronomy/venus-phases`): Use a planisphere and basic telescope to track Venus through its lunar-like phases. _Prerequisites:_ `astronomy/saturn-rings`.
        - **Capture Star Trails** (`astronomy/star-trails`): Use long-exposure photography to show the Earth's rotation. _Prerequisites:_ `astronomy/constellations`.
        - **Locate the North Star** (`astronomy/north-star`): Use the Big Dipper to spot Polaris for navigation practice. _Prerequisites:_ `astronomy/constellations`.
        - **Measure Light Pollution** (`astronomy/light-pollution`): Count Orion's stars with a planisphere and red flashlight. Log the count. _Prerequisites:_ `astronomy/constellations`.
        - **Planetary Alignment** (`astronomy/planetary-alignment`): Use a star chart to track a rare alignment of planets. _Prerequisites:_ `astronomy/constellations`.
        - **Split a Binary Star** (`astronomy/binary-star`): Use a basic telescope and planisphere to find Albireo and note its colors. _Prerequisites:_ `astronomy/constellations`.
        - **Track a Satellite Pass** (`astronomy/satellite-pass`): Nova helps you follow an overhead satellite using your telescope. _Prerequisites:_ `astronomy/meteor-shower`.
        - **Track a Visiting Comet** (`astronomy/comet-tracking`): Use your telescope to plot a comet's path across several nights. _Prerequisites:_ `astronomy/meteor-shower`.
          - **Watch the Aurora** (`astronomy/aurora-watch`): Check the aurora forecast and step outside with a red flashlight to log the lights. _Prerequisites:_ `astronomy/light-pollution`.

## chemistry

- **Demonstrate a Safe Chemical Reaction** (`chemistry/safe-reaction`): Phoenix walks you through a harmless experiment that introduces eco-friendly propellant basics. _Prerequisites:_ `welcome/howtodoquests`.
  - **Extract Stevia Sweetener** (`chemistry/stevia-extraction`): Use simple chemistry to make a sweet extract from stevia leaves. _Prerequisites:_ `hydroponics/stevia`, `chemistry/safe-reaction`.
  - **Measure Solution pH** (`chemistry/ph-test`): Use pH strips to check solution acidity while wearing protective gear. _Prerequisites:_ `chemistry/safe-reaction`.
    - **Adjust Solution pH** (`chemistry/ph-adjustment`): Bring a nutrient solution into range using acid or base. _Prerequisites:_ `chemistry/ph-test`.
    - **Dilute Hydrochloric Acid Safely** (`chemistry/acid-dilution`): Slowly stir 37% hydrochloric acid into water in full PPE over a spill tray. Never add water to acid. _Prerequisites:_ `chemistry/ph-test`.
    - **Form a Precipitate** (`chemistry/precipitation-reaction`): Mix two solutions until a solid appears. _Prerequisites:_ `chemistry/ph-test`.
    - **Neutralize an Acid Spill** (`chemistry/acid-neutralization`): Use basic chemistry to make a workspace safe again. _Prerequisites:_ `chemistry/ph-test`.
    - **Prepare a Buffer Solution** (`chemistry/buffer-solution`): Mix vinegar and baking soda to resist pH swings. _Prerequisites:_ `chemistry/ph-test`.
    - **Refine Stevia Crystals** (`chemistry/stevia-crystals`): Purify your extract into concentrated crystals _Prerequisites:_ `chemistry/stevia-extraction`.
      - **Taste Test Stevia Crystals** (`chemistry/stevia-tasting`): Evaluate the sweetness of your freshly made stevia crystals. _Prerequisites:_ `chemistry/stevia-crystals`.

## completionist

- **Congrats for finishing all the quests!!** (`completionist/v2`): Here's a trophy for your efforts! _Prerequisites:_ `welcome/howtodoquests`, `ubi/basicincome`, `3dprinter/start`, `aquaria/water-testing`, `energy/solar-1kWh`, `rocketry/parachute`, `hydroponics/basil`.
  - **Catalog Your Trophy** (`completionist/catalog`): Log your Completionist Award II so you never misplace it. _Prerequisites:_ `completionist/v2`.
  - **Check for New Quests** (`completionist/reminder`): Return regularly to see what fresh challenges await you. _Prerequisites:_ `completionist/v2`.
  - **Polish Your Trophy** (`completionist/polish`): Keep your Completionist Award II shiny and proud. _Prerequisites:_ `completionist/v2`.
  - **Show Off Your Trophy** (`completionist/display`): Give your Completionist Award II a dedicated spot on the shelf. _Prerequisites:_ `completionist/v2`.

## composting

- **Start a Compost Bucket** (`composting/start`): Begin recycling kitchen scraps into soil. _Prerequisites:_ `hydroponics/reservoir-refresh`.
  - **Check Compost Temperature** (`composting/check-temperature`): Measure the heat of your compost to ensure active decomposition. _Prerequisites:_ `composting/start`.
  - **Turn Your Compost Bucket** (`composting/turn-pile`): Aerate the compost by stirring the mix so microbes stay active. _Prerequisites:_ `composting/start`.
    - **Sift Finished Compost** (`composting/sift-compost`): Screen compost to remove large chunks for a fine finished mix. _Prerequisites:_ `composting/turn-pile`.

## devops

- **Plan Your Pi Cluster** (`devops/pi-cluster-hardware`): Orion lists the parts needed to build a Raspberry Pi cluster. _Prerequisites:_ `sysadmin/basic-commands`.
  - **Prepare the First Node** (`devops/prepare-first-node`): Flash the OS and install Docker under Orion's guidance. _Prerequisites:_ `devops/pi-cluster-hardware`.
    - **Boot from SSD** (`devops/ssd-boot`): Clone the OS to an SSD and enable M.2 boot. _Prerequisites:_ `devops/prepare-first-node`.
    - **Launch DSPACE in Docker** (`devops/docker-compose`): Start DSPACE with Docker Compose and expose it securely through a Cloudflare Tunnel. _Prerequisites:_ `devops/prepare-first-node`.
      - **Deploy with k3s** (`devops/k3s-deploy`): Orion teaches you how to run DSPACE across multiple Pis with k3s. _Prerequisites:_ `devops/docker-compose`.
      - **Run a Private Docker Registry** (`devops/private-registry`): Host your own Docker images on the cluster. _Prerequisites:_ `devops/docker-compose`.
      - **Set Up a CI Pipeline** (`devops/ci-pipeline`): Configure GitHub Actions to run tests whenever you push. _Prerequisites:_ `devops/docker-compose`.
        - **Set Up Monitoring** (`devops/monitoring`): Install Prometheus and Grafana to monitor your Pi cluster. _Prerequisites:_ `devops/k3s-deploy`.
          - **Configure Daily Backups** (`devops/daily-backups`): Use a cron job to archive your game data each night. _Prerequisites:_ `devops/monitoring`.
          - **Enable Automatic Updates** (`devops/auto-updates`): Keep your Pi cluster secure with unattended upgrades. _Prerequisites:_ `devops/monitoring`.
            - **Configure Firewall Rules** (`devops/firewall-rules`): Lock down network ports to only what you need. _Prerequisites:_ `devops/auto-updates`.
            - **Secure the Cluster with HTTPS** (`devops/enable-https`): Use Let's Encrypt to add TLS encryption to your services. _Prerequisites:_ `devops/daily-backups`.
            - **Set Up Log Rotation** (`devops/log-maintenance`): Prevent logs from filling your server by compressing old files. _Prerequisites:_ `devops/daily-backups`.
              - **Harden SSH Access** (`devops/ssh-hardening`): Use key-based authentication and disable password logins. _Prerequisites:_ `devops/firewall-rules`.
                - **Block SSH Brute Force** (`devops/fail2ban`): Install Fail2ban to ban repeated failed logins. _Prerequisites:_ `devops/ssh-hardening`.

## electronics

- **Build a basic LED circuit** (`electronics/basic-circuit`): Wire a 5 mm LED and 220 Ω resistor on a breadboard to learn basic circuits. _Prerequisites:_ `welcome/howtodoquests`.
  - **Blink an LED with Arduino** (`electronics/arduino-blink`): Learn to program a microcontroller by blinking an LED. _Prerequisites:_ `electronics/basic-circuit`.
  - **Build a Light Sensor** (`electronics/light-sensor`): Use a photoresistor and Arduino to measure ambient brightness. _Prerequisites:_ `electronics/basic-circuit`.
  - **Build a Voltage Divider** (`electronics/voltage-divider`): Split 5 V to about 2.5 V using 220 Ω and 10 kΩ resistors on a Breadboard. _Prerequisites:_ `electronics/basic-circuit`.
  - **Check a battery pack's voltage** (`electronics/check-battery-voltage`): Use a digital multimeter to check a 12 V LiFePO4 battery pack after disconnecting it and placing it on a dry, non-conductive surface. Wear safety goggles throughout. _Prerequisites:_ `electronics/basic-circuit`.
  - **Measure LED Current** (`electronics/measure-led-current`): Use a digital multimeter to measure the current through a basic LED circuit. _Prerequisites:_ `electronics/basic-circuit`.
  - **Tin a Soldering Iron** (`electronics/tin-soldering-iron`): Prepare your soldering iron for clean joints by tinning the tip. _Prerequisites:_ `electronics/basic-circuit`.
  - **Verify resistor color bands** (`electronics/resistor-color-check`): Confirm a resistor's value by decoding its color bands before installing it in a circuit. _Prerequisites:_ `electronics/basic-circuit`.
    - **Check LED polarity with a multimeter** (`electronics/led-polarity`): Use a digital multimeter's diode mode to find which lead of a loose 5 mm LED is positive. Disconnect power, work on a dry non-conductive surface, wear safety goggles, and only use the meter's built-in diode test. _Prerequisites:_ `electronics/check-battery-voltage`.
    - **Dim an LED with a Potentiometer** (`electronics/potentiometer-dimmer`): Adjust LED brightness using a potentiometer and an Arduino. _Prerequisites:_ `electronics/arduino-blink`.
    - **Measure a Resistor** (`electronics/measure-resistance`): Use a digital multimeter to confirm a loose resistor's value. Disconnect all power, keep metal jewelry off, set components on a dry non-conductive surface, and wear safety goggles. _Prerequisites:_ `electronics/resistor-color-check`.
    - **Measure Arduino 5 V output** (`electronics/measure-arduino-5v`): Verify the 5 V pin on an Arduino Uno with a multimeter. _Prerequisites:_ `electronics/arduino-blink`.
    - **Solder a Wire Connection** (`electronics/solder-wire`): Join jumper wires with a soldering kit, heat-shrink tubing, and a heat gun. Keep a brass tip cleaner handy, ventilate, and wear safety goggles. _Prerequisites:_ `electronics/tin-soldering-iron`.
    - **Solder an LED Harness** (`electronics/solder-led-harness`): Join a 5 mm LED and 220 Ω resistor to two jumper wires using a soldering iron kit. Ventilate and wear safety goggles. _Prerequisites:_ `electronics/tin-soldering-iron`.
    - **Sweep a Servo** (`electronics/servo-sweep`): Use the Arduino IDE's Servo library 'Sweep' example to rotate a hobby servo from 0° to 180°. _Prerequisites:_ `electronics/arduino-blink`.
      - **Check USB cable continuity** (`electronics/continuity-test`): Use a digital multimeter in continuity mode to check an unplugged USB cable while wearing safety goggles. _Prerequisites:_ `electronics/solder-wire`.
      - **Desolder a component** (`electronics/desolder-component`): Remove a through-hole resistor from a scrap PCB using a desoldering pump, flux pen and solder wick. Work in a ventilated area and wear safety goggles. _Prerequisites:_ `electronics/solder-wire`.
      - **Read a Thermistor** (`electronics/thermistor-reading`): Wire a thermistor to your Arduino and log temperature values. _Prerequisites:_ `electronics/potentiometer-dimmer`.
        - **Calibrate a Thermometer** (`electronics/thermometer-calibration`): Use water baths to verify your thermometer's accuracy. _Prerequisites:_ `electronics/thermistor-reading`.
        - **Log Temperature Data** (`electronics/data-logger`): Use a Raspberry Pi to record readings from your thermistor. _Prerequisites:_ `electronics/thermistor-reading`.
        - **Test a GFCI Outlet** (`electronics/test-gfci-outlet`): Verify a ground-fault circuit interrupter outlet with a plug-in tester. _Prerequisites:_ `electronics/continuity-test`.
          - **Plot Temperature Data** (`electronics/temperature-plot`): Generate a chart from your thermistor log using Python. _Prerequisites:_ `electronics/data-logger`.

## energy

- **Set up a solar panel** (`energy/solar`): The wall outlet is convenient, but your utility uses fossil fuels for electricity generation! Let's take things in our own hands and start going off the grid. _Prerequisites:_ `welcome/howtodoquests`.
  - **Accumulate 1,000 dWatt** (`energy/dWatt-1e3`): Boost your energy potential! To unlock this quest's reward, accumulate at least 1,000 dWatt in your inventory. _Prerequisites:_ `energy/solar`.
  - **Build a Hand Crank Generator** (`energy/hand-crank-generator`): Print parts and assemble a hand crank generator to charge a 200 Wh battery pack. _Prerequisites:_ `energy/solar`.
  - **Build a Solar Tracker** (`energy/solar-tracker`): Rotate your 200 Wh kit to follow the sun. _Prerequisites:_ `energy/solar`.
  - **Charge a Device Off-Grid** (`energy/offgrid-charger`): Charge a phone off-grid with a 200 W panel, charge controller, 200 Wh LiFePO4 battery and USB cable. _Prerequisites:_ `energy/solar`.
  - **Configure a Solar Charge Controller** (`energy/charge-controller-setup`): Wire and configure a charge controller to safely charge your 200 Wh battery. _Prerequisites:_ `energy/solar`.
  - **Install a Larger Battery** (`energy/battery-upgrade`): Expand your solar setup with a 1 kWh storage pack and enclosure. _Prerequisites:_ `energy/solar`.
  - **Maintain Your Battery Pack** (`energy/battery-maintenance`): Cycle your 200 Wh battery pack with solar to keep it healthy. _Prerequisites:_ `energy/solar`.
  - **Test a Portable Solar Panel** (`energy/portable-solar-panel`): Harvest sunshine anywhere with a foldable panel. _Prerequisites:_ `energy/solar`.
  - **Upgrade your solar enclosure with more capacity** (`energy/solar-1kWh`): Swap out that tiny 200 Wh battery pack for a new 1 kWh one! No upgrade in charge speed just yet, just more capacity! _Prerequisites:_ `energy/solar`.
    - **Accrue 1,000 dSolar** (`energy/dSolar-1kW`): Reach increasingly higher levels of energy production! To complete this quest, have at least 1,000 dSolar in your inventory. _Prerequisites:_ `energy/solar-1kWh`.
    - **Accumulate 10,000 dWatt** (`energy/dWatt-1e4`): Supercharge your energy reserves! To claim your prize, gather at least 10,000 dWatt in your inventory. _Prerequisites:_ `energy/dWatt-1e3`.
    - **Build a Biogas Digester** (`energy/biogas-digester`): Ferment kitchen scraps into methane for cooking. _Prerequisites:_ `energy/solar-1kWh`.
    - **Install a Power Inverter** (`energy/power-inverter`): Convert your battery's DC output into AC for household gear. _Prerequisites:_ `energy/battery-upgrade`.
    - **Install a Wind Turbine** (`energy/wind-turbine`): Supplement your solar setup with power from the breeze. _Prerequisites:_ `energy/solar-1kWh`.
      - **Accrue 10,000 dSolar** (`energy/dSolar-10kW`): Push the boundaries of energy production! To complete this quest, have at least 10,000 dSolar in your inventory. _Prerequisites:_ `energy/dSolar-1kW`.
      - **Achieve an Astounding 1,000,000 dWatt** (`energy/dWatt-1e6`): Reach the pinnacle of energy gathering! Secure your legacy by accumulating 1,000,000 dWatt. _Prerequisites:_ `energy/dWatt-1e4`.
      - **Collect a Stunning 100,000 dWatt** (`energy/dWatt-1e5`): Ascent to greater heights in energy collection! To be rewarded, amass a significant 100,000 dWatt. _Prerequisites:_ `energy/dWatt-1e4`.
        - **Accrue 100,000 dSolar** (`energy/dSolar-100kW`): Set new standards in solar energy production! To complete this quest, have at least 100,000 dSolar in your inventory. _Prerequisites:_ `energy/dSolar-10kW`.
        - **Amass an Unbelievable 10,000,000 dWatt** (`energy/dWatt-1e7`): Challenge the very fabric of what's considered possible! Conquer this monumental task by stockpiling 10,000,000 dWatt. _Prerequisites:_ `energy/dWatt-1e5`.
          - **Store a Colossal 100,000,000 dWatt** (`energy/dWatt-1e8`): Prove your dedication by collecting a staggering 100,000,000 dWatt. _Prerequisites:_ `energy/dWatt-1e7`.

## firstaid

- **Assemble a First Aid Kit** (`firstaid/assemble-kit`): Assemble a basic first aid kit so you're ready for minor injuries. _Prerequisites:_ `welcome/howtodoquests`.
  - **Check Flashlight Battery** (`firstaid/flashlight-battery`): Measure your emergency flashlight's 9 V battery with a digital multimeter. _Prerequisites:_ `firstaid/assemble-kit`.
  - **Practice Basic CPR** (`firstaid/learn-cpr`): Practice 30:2 compressions on a CPR manikin using nitrile gloves, a pocket mask and antiseptic wipes from your first aid kit. Confirm the area is safe, call emergency services first and sanitize gear after. This exercise does not replace formal certification. _Prerequisites:_ `firstaid/assemble-kit`.
  - **Restock Your First Aid Kit** (`firstaid/restock-kit`): Replace used supplies so you're ready for emergencies. _Prerequisites:_ `firstaid/assemble-kit`.
  - **Stop a Nosebleed** (`firstaid/stop-nosebleed`): Sit upright, lean forward, and pinch the soft part of your nose with a sterile gauze pad. Wear nitrile gloves from a first aid kit, use an antiseptic wipe around your nostrils after bleeding slows, and keep your head tilted forward the whole time. Never tilt your head back or insert anything into the nostrils. _Prerequisites:_ `firstaid/assemble-kit`.
  - **Treat a Minor Burn** (`firstaid/treat-burn`): Cool and dress a small burn so it heals cleanly. _Prerequisites:_ `firstaid/assemble-kit`.
    - **Dispose Expired First Aid Supplies** (`firstaid/dispose-expired`): Clear out old items so your first aid kit stays reliable. _Prerequisites:_ `firstaid/restock-kit`.
    - **Practice Basic Wound Care** (`firstaid/wound-care`): Practice cleaning a minor cut with soap, gloves, an antiseptic wipe, antibiotic ointment and a bandage. _Prerequisites:_ `firstaid/learn-cpr`.
    - **Sanitize Your CPR Pocket Mask** (`firstaid/sanitize-pocket-mask`): Clean and disinfect your CPR mask so it's safe for the next emergency. _Prerequisites:_ `firstaid/learn-cpr`.
      - **Change a Bandage** (`firstaid/change-bandage`): Swap an old bandage for a fresh one to keep a minor cut clean. _Prerequisites:_ `firstaid/wound-care`.
      - **Remove a Splinter** (`firstaid/remove-splinter`): Take out a small splinter to prevent infection. _Prerequisites:_ `firstaid/wound-care`.
      - **Splint a Minor Fracture** (`firstaid/splint-limb`): Practice immobilizing a minor limb injury with supplies from a first aid kit. Only attempt this on stable injuries and call emergency services for serious fractures. _Prerequisites:_ `firstaid/wound-care`.
        - **Bag Used Bandages** (`firstaid/dispose-bandages`): Use a biohazard bag to discard used bandages and wash up. _Prerequisites:_ `firstaid/change-bandage`.

## geothermal

- **Survey for Geothermal Heat** (`geothermal/survey-ground-temperature`): Measure the ground temperature to see if a heat pump will work. _Prerequisites:_ `energy/solar`.
  - **Calibrate Ground Sensor** (`geothermal/calibrate-ground-sensor`): Use ice and boiling water to calibrate your thermistor before burying it. _Prerequisites:_ `geothermal/survey-ground-temperature`.
  - **Check Loop Inlet Temperature** (`geothermal/check-loop-inlet-temp`): Use an Arduino to log the water temperature entering the heat pump. _Prerequisites:_ `geothermal/survey-ground-temperature`.
  - **Check Loop Pressure** (`geothermal/check-loop-pressure`): Verify the ground loop is holding pressure with a quick gauge check. _Prerequisites:_ `geothermal/survey-ground-temperature`.
  - **Log Ground Temperature** (`geothermal/log-ground-temperature`): Use a buried thermistor with Arduino to monitor ground temperature over time. _Prerequisites:_ `geothermal/survey-ground-temperature`.
  - **Monitor Heat Pump Energy Use** (`geothermal/monitor-heat-pump-energy`): Install a smart plug to track how much power your ground loop consumes. _Prerequisites:_ `geothermal/survey-ground-temperature`.
  - **Purge Air from Ground Loop** (`geothermal/purge-loop-air`): Use a submersible pump to flush out trapped bubbles from your geothermal loop. _Prerequisites:_ `geothermal/survey-ground-temperature`.
    - **Backflush Loop Filter** (`geothermal/backflush-loop-filter`): Use a submersible pump to rinse debris from the geothermal loop filter. _Prerequisites:_ `geothermal/purge-loop-air`.
    - **Check Loop Outlet Temperature** (`geothermal/check-loop-outlet-temp`): Log the water temperature leaving the heat pump with an Arduino thermistor. _Prerequisites:_ `geothermal/check-loop-inlet-temp`.
    - **Compare Depth Ground Temps** (`geothermal/compare-depth-ground-temps`): Bury two thermistors at different depths and log their readings for a day. _Prerequisites:_ `geothermal/log-ground-temperature`.
    - **Compare Seasonal Ground Temps** (`geothermal/compare-seasonal-ground-temps`): Use a second thermistor to log ground temperatures in different seasons. _Prerequisites:_ `geothermal/log-ground-temperature`.
    - **Install Backup Thermistor** (`geothermal/install-backup-thermistor`): Add a second probe so you can cross-check ground temperature readings. _Prerequisites:_ `geothermal/calibrate-ground-sensor`.
    - **Log Heat Pump Warmup** (`geothermal/log-heat-pump-warmup`): Track how quickly the loop temperature rises after startup. _Prerequisites:_ `geothermal/log-ground-temperature`.
      - **Check Loop Temperature Delta** (`geothermal/check-loop-temp-delta`): Use two thermistors with an Arduino to compare loop inlet and outlet temps. _Prerequisites:_ `geothermal/check-loop-inlet-temp`, `geothermal/check-loop-outlet-temp`.
      - **Replace Faulty Thermistor** (`geothermal/replace-faulty-thermistor`): Swap out a dead probe and verify readings stay true. _Prerequisites:_ `geothermal/install-backup-thermistor`.

## hydroponics

- **Grow basil hydroponically** (`hydroponics/basil`): Learn how to grow plants without soil! _Prerequisites:_ `welcome/howtodoquests`.
  - **Bucket, we'll do it live!** (`hydroponics/bucket_10`): Have 10 buckets of dechlorinated water in your inventory. For some reason. _Prerequisites:_ `hydroponics/basil`, `3dprinter/start`.
  - **Grow Lettuce Hydroponically** (`hydroponics/lettuce`): Plant lettuce seeds and harvest fresh leaves using your hydroponic setup. _Prerequisites:_ `hydroponics/basil`.
  - **Refresh Nutrient Solution** (`hydroponics/nutrient-check`): Top off your hydroponic tub with fresh nutrients while keeping yourself and the plants safe. _Prerequisites:_ `hydroponics/basil`.
  - **Refresh the Reservoir** (`hydroponics/reservoir-refresh`): Swap out old nutrient solution for a fresh batch. _Prerequisites:_ `hydroponics/basil`.
    - **Check Solution pH** (`hydroponics/ph-check`): Measure the nutrient bath's pH and correct it to keep plants happy. _Prerequisites:_ `hydroponics/nutrient-check`.
    - **Check Water Temperature** (`hydroponics/temp-check`): Make sure the reservoir stays in the sweet spot. _Prerequisites:_ `hydroponics/nutrient-check`.
    - **Grow Stevia Hydroponically** (`hydroponics/stevia`): Cultivate stevia plants for a natural sweetener. _Prerequisites:_ `hydroponics/lettuce`.
    - **Install a Grow Light** (`hydroponics/grow-light`): Mount a full-spectrum LED grow lamp and automate a 12 h light cycle with a smart plug and timer. _Prerequisites:_ `hydroponics/bucket_10`.
    - **Install Submersible Pump** (`hydroponics/pump-install`): Add circulation to keep nutrients moving. _Prerequisites:_ `hydroponics/reservoir-refresh`.
    - **Scrub the Grow Tub** (`hydroponics/tub-scrub`): Remove biofilm from the reservoir walls. _Prerequisites:_ `hydroponics/reservoir-refresh`.
    - **Test Hydroponic pH** (`hydroponics/ph-test`): Check acidity so your plants stay healthy. _Prerequisites:_ `hydroponics/nutrient-check`.
      - **Calibrate EC Meter** (`hydroponics/ec-calibrate`): Use calibration solution so readings stay accurate. _Prerequisites:_ `hydroponics/ph-check`.
      - **Clean Net Cups** (`hydroponics/netcup-clean`): Sanitize net cups to keep roots disease-free. _Prerequisites:_ `hydroponics/tub-scrub`.
      - **Prime Water Pump** (`hydroponics/pump-prime`): Prep the pump so it doesn't run dry. _Prerequisites:_ `hydroponics/pump-install`.
      - **Regrow Your Stevia** (`hydroponics/regrow-stevia`): Hydro shows you how to coax another harvest from trimmed plants. _Prerequisites:_ `hydroponics/stevia`.
      - **Top Off the Reservoir** (`hydroponics/top-off`): Add fresh water to keep nutrient levels stable. _Prerequisites:_ `hydroponics/pump-install`.
        - **Check Solution EC** (`hydroponics/ec-check`): Measure nutrient strength with an EC meter. _Prerequisites:_ `hydroponics/ec-calibrate`.
        - **Rinse Grow Bed Filter** (`hydroponics/filter-clean`): Clear out the gunk so the roots can breathe. _Prerequisites:_ `hydroponics/top-off`.
        - **Soak Starter Plugs** (`hydroponics/plug-soak`): Hydrate rockwool cubes so seeds sprout happily. _Prerequisites:_ `hydroponics/top-off`.
          - **Clone Mint Cutting** (`hydroponics/mint-cutting`): Root a mint sprig for endless tea. _Prerequisites:_ `hydroponics/plug-soak`.
          - **Rinse the Roots** (`hydroponics/root-rinse`): Flush salts from the root zone with clean water. _Prerequisites:_ `hydroponics/filter-clean`.
          - **Soak Air Stone** (`hydroponics/air-stone-soak`): Prime the air stone so bubbles stay even. _Prerequisites:_ `hydroponics/filter-clean`.

## programming

- **Log Temperature Data** (`programming/hello-sensor`): dChat shows you how a short script can capture sensor information for later analysis. _Prerequisites:_ `electronics/arduino-blink`.
- **Log Temperature Data** (`programming/temp-logger`): Write a simple script that records hourly temperature readings. _Prerequisites:_ `electronics/thermistor-reading`.
  - **Calibrate a Thermistor** (`programming/thermistor-calibration`): Use a 10k thermistor to measure temperature accurately with an Arduino script. _Prerequisites:_ `programming/hello-sensor`.
  - **Compute Average Temperature** (`programming/avg-temp`): Write a small script that reads your log file and prints the daily average temperature. _Prerequisites:_ `programming/temp-logger`.
  - **Graph Temperature Data** (`programming/temp-graph`): Plot the values from your logger to visualize trends over time. _Prerequisites:_ `programming/temp-logger`.
  - **Graph Temperature Logs** (`programming/graph-temp`): Visualize the data you recorded with temp-logger. _Prerequisites:_ `programming/temp-logger`.
  - **Graph Your Temperature Logs** (`programming/graph-temp-data`): Use a short script to plot the readings you've been recording. _Prerequisites:_ `programming/temp-logger`.
  - **Plot Temperature Data via CLI** (`programming/plot-temp-cli`): Use Python to turn your temperature log into a line chart. _Prerequisites:_ `programming/temp-logger`.
  - **Serve a Web Page** (`programming/web-server`): Write a tiny HTTP server that responds with 'Hello, world'. _Prerequisites:_ `programming/hello-sensor`.
    - **Compute Median Temperature** (`programming/median-temp`): Extend your script to report the median temperature from your log. _Prerequisites:_ `programming/avg-temp`.
    - **Compute Moving Average Temperature** (`programming/moving-avg-temp`): Add a moving average to your temperature analysis script. _Prerequisites:_ `programming/avg-temp`.
    - **Serve JSON Data** (`programming/json-api`): Extend your server to respond with structured JSON. _Prerequisites:_ `programming/web-server`.
    - **Serve JSON Data** (`programming/json-endpoint`): Extend your server to respond with structured JSON. _Prerequisites:_ `programming/web-server`.
    - **Set Temperature Alert** (`programming/temp-alert`): Write a script that warns you when the sensor crosses a threshold. _Prerequisites:_ `programming/temp-graph`.
      - **Accept POST Data** (`programming/http-post`): Update your server to handle POST requests and log JSON payloads. _Prerequisites:_ `programming/json-api`.
      - **Compute Temperature Standard Deviation** (`programming/stddev-temp`): Extend your script to report the standard deviation of daily temperature readings. _Prerequisites:_ `programming/median-temp`.
      - **Email Temperature Alert** (`programming/temp-email`): Trigger an email when the sensor exceeds a set temperature. _Prerequisites:_ `programming/temp-alert`.
      - **Serve Temperature as JSON** (`programming/temp-json-api`): Expose the latest sensor reading at a JSON endpoint. _Prerequisites:_ `programming/json-api`.

## robotics

- **Control a Servo Motor** (`robotics/servo-control`): Learn to move a servo with an Arduino. _Prerequisites:_ `electronics/arduino-blink`.
- **Measure distance with an ultrasonic sensor** (`robotics/ultrasonic-rangefinder`): Use an HC-SR04 to measure distances with Arduino. _Prerequisites:_ `electronics/arduino-blink`.
  - **Add Wheel Encoders** (`robotics/wheel-encoders`): Install wheel encoders to log wheel rotation for straighter paths. Disconnect power and secure the robot before wiring. _Prerequisites:_ `robotics/servo-control`.
  - **Build a Servo Gripper** (`robotics/servo-gripper`): Use a small servo to make a claw that can pick up objects. _Prerequisites:_ `robotics/servo-control`.
  - **Make a Pan-Tilt Mount** (`robotics/pan-tilt`): Use two servos to scan your surroundings. _Prerequisites:_ `robotics/servo-control`.
    - **Assemble a Servo Arm** (`robotics/servo-arm`): Build a simple arm that can lift light objects. _Prerequisites:_ `robotics/servo-gripper`.
    - **Build a line-following robot** (`robotics/line-follower`): Mount reflectance sensors and tune motor control so your robot hugs a taped course. _Prerequisites:_ `robotics/servo-control`, `robotics/wheel-encoders`.
    - **Scan with a servo-mounted sensor** (`robotics/servo-radar`): Sweep an ultrasonic sensor on a servo to map nearby obstacles and create a simple scan. _Prerequisites:_ `robotics/pan-tilt`, `robotics/ultrasonic-rangefinder`.
    - **Track distance with wheel encoders** (`robotics/odometry-basics`): Use encoder pulses to compute how far your robot travels. _Prerequisites:_ `robotics/wheel-encoders`.
      - **Add Obstacle Avoidance** (`robotics/obstacle-avoidance`): Mount an ultrasonic sensor so your line follower can spot obstacles and steer around them. _Prerequisites:_ `robotics/line-follower`, `robotics/ultrasonic-rangefinder`.
      - **Balance with a gyroscope** (`robotics/gyro-balance`): Use a gyroscope and tuned drive base to keep a two-wheeled platform upright. _Prerequisites:_ `robotics/odometry-basics`.
        - **Navigate a Simple Maze** (`robotics/maze-navigation`): Combine line following, obstacle dodging, and odometry to drive through a taped maze. _Prerequisites:_ `robotics/obstacle-avoidance`, `robotics/odometry-basics`.

## rocketry

- **First rocket launch!** (`rocketry/firstlaunch`): Print and launch your own model rocket. Follow the steps to print, assemble, and launch the rocket. Get ready for liftoff! _Prerequisites:_ `3dprinter/start`.
  - **Add a parachute** (`rocketry/parachute`): Upgrade your rocket with a nylon parachute for gentle landings and possible reuse. _Prerequisites:_ `rocketry/firstlaunch`.
  - **Fuel Mixture Calibration** (`rocketry/fuel-mixture`): Dial in a safe oxidizer-to-fuel ratio for a hobbyist model rocket before launch. _Prerequisites:_ `rocketry/firstlaunch`.
  - **Preflight Checklist** (`rocketry/preflight-check`): Confirm gear and run a quick launch sequence. _Prerequisites:_ `rocketry/firstlaunch`.
    - **Build a Guided Model Rocket** (`rocketry/guided-rocket-build`): Print a servo-ready fincan, assemble the avionics, and program guidance for a camera-equipped hop. _Prerequisites:_ `rocketry/firstlaunch`, `rocketry/parachute`, `rocketry/preflight-check`.
    - **Check the Launch Winds** (`rocketry/wind-check`): Measure wind speed to ensure safe rocket launches. _Prerequisites:_ `rocketry/preflight-check`.
    - **Perform a Static Engine Test** (`rocketry/static-test`): Fire your rocket engine while it's secured to verify thrust and stability. _Prerequisites:_ `rocketry/parachute`.
    - **Practice Rocket Recovery** (`rocketry/recovery-run`): Launch with a parachute and retrieve the rocket intact. _Prerequisites:_ `rocketry/parachute`.
      - **Guided Model Rocket Hop** (`rocketry/suborbital-hop`): Run the guided hop simulator, prep the range, and fly a servo-stabilized model rocket with onboard video. _Prerequisites:_ `rocketry/recovery-run`, `rocketry/preflight-check`, `rocketry/guided-rocket-build`.
      - **Night Launch** (`rocketry/night-launch`): Take your rocket experience to the stars with a night launch. Gather your gear and light up the sky. _Prerequisites:_ `rocketry/recovery-run`.

## sysadmin

- **Learn Basic Linux Commands** (`sysadmin/basic-commands`): Practice core shell commands on an Ubuntu 24.04 LTS Minimal server. _Prerequisites:_ `welcome/howtodoquests`.
  - **Monitor System Resources** (`sysadmin/resource-monitoring`): Track CPU, memory, and disk on Ubuntu 24.04 LTS Minimal using top and df. _Prerequisites:_ `sysadmin/basic-commands`.
    - **Inspect System Logs** (`sysadmin/log-analysis`): Use journalctl and tail to spot issues on Ubuntu 24.04 LTS Minimal. _Prerequisites:_ `sysadmin/resource-monitoring`.

## ubi

- **Earn basic income** (`ubi/basicincome`): Learn about the basic income system and how to earn dUSD. _Prerequisites:_ `3dprinter/start`.
  - **Claim Your First UBI** (`ubi/first-payment`): Withdraw your daily dUSD for the first time. _Prerequisites:_ `ubi/basicincome`.
    - **Set a UBI Reminder** (`ubi/reminder`): Schedule a daily reminder so you never miss your dUSD payout. _Prerequisites:_ `ubi/first-payment`.
    - **Start a Savings Jar** (`ubi/savings-goal`): Set aside some dUSD for future plans. _Prerequisites:_ `ubi/first-payment`.

## welcome

- **How to do quests** (`welcome/howtodoquests`): Learn how quest mechanics work, including dialogue choices, real items, and safe processes. _Prerequisites:_ None.
  - **Check Your Inventory** (`welcome/intro-inventory`): Learn how to view items you've collected so far. _Prerequisites:_ `welcome/howtodoquests`.
  - **Connect GitHub** (`welcome/connect-github`): Link your GitHub account to enable cloud sync and quest submissions. _Prerequisites:_ `welcome/howtodoquests`.
  - **Run the Test Suite** (`welcome/run-tests`): Learn how to run DSPACE's automated tests to ensure your changes are correct. _Prerequisites:_ `welcome/howtodoquests`.
  - **Smart Plug Test** (`welcome/smart-plug-test`): Use a smart plug to buy 1 kWh from a wall outlet and mint 1,000 dWatt tokens. _Prerequisites:_ `welcome/howtodoquests`.

## woodworking

- **Build a Planter Box** (`woodworking/planter-box`): Cedar guides you through crafting a simple planter for herbs. _Prerequisites:_ `welcome/howtodoquests`.
  - **Build a birdhouse** (`woodworking/birdhouse`): Use simple tools to craft a birdhouse that builds on your planter-box skills. _Prerequisites:_ `woodworking/planter-box`.
    - **Build a step stool** (`woodworking/step-stool`): Build a sturdy pine step stool and practice safe cutting and gluing before tackling bigger benches. _Prerequisites:_ `woodworking/birdhouse`.
      - **Build a simple workbench** (`woodworking/workbench`): Build a sturdy bench with stretchers and a flat top to support future projects. _Prerequisites:_ `woodworking/step-stool`.
      - **Finish Sand Your Project** (`woodworking/finish-sanding`): Smooth the surface of your latest build with fine-grit paper before applying finish. _Prerequisites:_ `woodworking/step-stool`.
        - **Apply a Wood Finish** (`woodworking/apply-finish`): Seal your project with a protective coat. _Prerequisites:_ `woodworking/finish-sanding`.
        - **Build a small bookshelf** (`woodworking/bookshelf`): Apply your skills to assemble a functional bookshelf. _Prerequisites:_ `woodworking/workbench`, `woodworking/finish-sanding`.
        - **Build a Tool Rack** (`woodworking/tool-rack`): Organize your workspace with a simple rack for hand tools. _Prerequisites:_ `woodworking/workbench`.
          - **Build a coffee table** (`woodworking/coffee-table`): Craft a low table to anchor your living space. _Prerequisites:_ `woodworking/bookshelf`.
          - **Craft a Picture Frame** (`woodworking/picture-frame`): Make a simple frame to showcase your favorite photo. _Prerequisites:_ `woodworking/tool-rack`.


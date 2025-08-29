---
title: 'Processes'
slug: 'processes'
---

Processes are the steps that machines take to convert ingredients, raw materials, or subcomponents
into other machines or objects. Think of them as blueprints or recipes. For guidance on designing
your own, see the [Process Development Guidelines](/docs/process-guidelines).

<img src="/assets/docs/process.jpg">

## Components

A process has the following components:

### Title

<img src="/assets/docs/process_title.jpg">

The title provides a concise and descriptive outline of the process.

### Requires list

<img src="/assets/docs/process_requires.jpg">

These are the items required to initiate the process, and they are not consumed during the process.

### Consumes list

<img src="/assets/docs/process_consumes.jpg">

The quantity of items consumed by the process. These items are removed from your inventory when the process is started. If a running process is canceled, the items are returned to your inventory.

### Creates list

<img src="/assets/docs/process_creates.jpg">

These are the items produced by the process, which are added to your inventory upon completion and collection.

### Duration

<img src="/assets/docs/process_duration.jpg">

Duration indicates the amount of time required for the process to complete. It's expressed in the form 1d 2h 3m 4s, meaning 1 day, 2 hours, 3 minutes, and 4 seconds. Process durations can range from mere seconds to several months or even years. The form normalizes input like `0.5h 30s` to `30m 30s` for consistency. Units are case-insensitive, so `1H 30M` works as well, and spaces between units are optional (e.g., `1h30m`).

#### Duration Examples

-   Quick processes: "2s", "30s", "1m"
-   Medium processes: "1h30m", "1h 30m", "2h 8m 11s"
-   Long processes: "12h 52m 51s", "48h", "7d", "28d"

The system automatically converts these durations into milliseconds for precise timing.

## Custom Processes

Starting with v3, you can create your own custom processes. When creating a custom process, keep in mind:

1. Duration Format: Accepts days (`d`), hours (`h`), minutes (`m`), and seconds (`s`), each optionally fractional (e.g., `1h 30m`, `45s`, `0.5h`). Values are normalized to a canonical format on submit.
2. Item Requirements:
    - Required items are checked but not consumed
    - Consumed items are removed at process start
    - Created items are added upon completion
3. Item Counts: Must be positive numbers
4. Process State Management:
    - Processes can be canceled and resumed
    - Consumed items are returned on cancellation
    - Progress is saved locally and persists between sessions

## Process Management

Use the **Manage Processes** page to review or delete custom entries. Built-in
processes appear alongside any you've created locally. Access it at
`/processes/manage`.
Each row includes a **Preview** button that displays a live summary of the
process so you can verify the details before editing or deleting it.

## Process Examples

Here are some example processes from the base game:

### 3D Printing

-   Benchy test print: 1h 30m, consumes 15 g filament and 150 dWatt
-   Rocket body tube: 2h 8m 11s, consumes 18.48g filament and 266.67 dWatt
-   Full rocket: 12h 52m 51s, consumes 91g filament and 1610.10 dWatt

### Hydroponics

-   Soak rockwool: 15m
-   Germinate basil: 7d
-   Grow basil: 28d, requires grow light, consumes 16128 dWatt

### Energy Generation

-   Solar 200Wh: 1h, creates 200 dWatt and 200 dSolar
-   Solar 1000Wh: 5h, creates 1000 dWatt and 1000 dSolar

## Lifecycle

The lifecycle of processes is depicted through their status, which is displayed in the top right corner of the process card.

### NOT_STARTED

<img src="/assets/docs/process_not_started.jpg">

In this state, a process is waiting to be started. You can start a process by clicking the Start button. If you do not have the required items, the Start button will do nothing. When you click Start, the items in the Consumes list will be removed from your inventory and the process will begin.

### IN_PROGRESS

<img src="/assets/docs/process_progress.jpg">

In this state, the process is active. You have the option to terminate an active process by clicking the Cancel button. If you cancel a process, your items will be returned to you. A countdown to the process's completion and a progress bar are also displayed in this state.

### PAUSED

In this state, the process is temporarily halted. The countdown stops until you choose to resume. You may resume the process later or cancel it to reclaim consumed items.

### FINISHED

<img src="/assets/docs/process_finished.jpg">

Once a process has been completed, items produced by the process can be collected by clicking the Collect button. When you click Collect, items from the Creates list are added to your inventory.

<style>
img {
    width: 100%;
}
</style>

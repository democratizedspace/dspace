---
title: "Processes"
slug: "processes"
---

Processes are the steps that machines take to convert ingredients, raw materials, or subcomponents into other machines or objects. Think of them as blueprints or recipes.

![](/assets/docs/process.jpg)

## Components

A process has the following components:

### Title

![](/assets/docs/process_title.jpg)

The title provides a concise and descriptive outline of the process.

### Requires list

![](/assets/docs/process_requires.jpg)

These are the items required to initiate the process, and they are not consumed during the process.

### Consumes list

![](/assets/docs/process_consumes.jpg)

The quantity of items consumed by the process. These items are removed from your inventory when the process is started. If a running process is canceled, the items are returned to your inventory.

### Creates list

![](/assets/docs/process_creates.jpg)

These are the items produced by the process, which are added to your inventory upon completion and collection.

### Duration

![](/assets/docs/process_duration.jpg)

Duration indicates the amount of time required for the process to complete. It's expressed in the form 1d 2h 3m 4s, meaning 1 day, 2 hours, 3 minutes, and 4 seconds. Process durations can range from mere seconds to several months or even years.

## Lifecycle

The lifecycle of processes is depicted through their status, which is displayed in the top right corner of the process card.

### NOT_STARTED

![](/assets/docs/process_not_started.jpg)

In this state, a process is waiting to be started. You can start a process by clicking the Start button. If you do not have the required items, the Start button will do nothing. When you click Start, the items in the Consumes list will be removed from your inventory and the process will begin.

### IN_PROGRESS

![](/assets/docs/process_progress.jpg)

In this state, the process is active. You have the option to terminate an active process by clicking the Cancel button. If you cancel a process, your items will be returned to you. A countdown to the process's completion and a progress bar are also displayed in this state.

### FINISHED

![](/assets/docs/process_finished.jpg)

Once a process has been completed, items produced by the process can be collected by clicking the Collect button. When you click Collect, items from the Creates list are added to your inventory.

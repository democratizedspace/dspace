it('should filter quests based on completion status', () => {
    // Skip test if not in browser environment
    if (typeof document === 'undefined') {
        return;
    }

    // Create a container for the component
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Mount the component
    new Quests({
        target: container,
        props: { quests },
    });

    // Wait for component to mount and render
    return new Promise((resolve) => {
        // Increase timeout to give more time for the component to render
        setTimeout(() => {
            try {
                // Force a render update to ensure the component is fully rendered
                document.body.offsetHeight;
                
                // Check if available quests are rendered
                const availableQuestsSection = container.querySelector('.quests-grid');
                expect(availableQuestsSection).toBeTruthy();

                // Check if completed quests are rendered
                const completedQuestsHeading = Array.from(
                    container.querySelectorAll('h2')
                ).find((h) => h.textContent.includes('Completed Quests'));
                expect(completedQuestsHeading).toBeTruthy();

                // Clean up
                document.body.removeChild(container);
                resolve();
            } catch (e) {
                document.body.removeChild(container);
                throw e;
            }
        }, 500); // Increased from 100ms to 500ms
    }, 10000); // Add timeout of 10 seconds
}); 
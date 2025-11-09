// Configuration for automatic beeps during routines
export const beepConfig = {
    // Apparatus that should have initial beep when timer starts
    initialBeepApparatus: ['vt', 'bb', 'ub'],
    
    // Timing beeps configuration (in seconds)
    timingBeeps: {
        'bb': [80, 90], // 1:20 and 1:30 for Balance Beam
        'ub': [50],     // 0:50 for Uneven Bars
        'vt': [],       // No timing beeps for Vault (only initial)
        'fx': []        // No beeps for Floor (has its own music)
    },
    
    // Visual feedback duration (in milliseconds)
    flashDuration: 400,
    
    // Audio settings
    audio: {
        volume: 0.8,
        preload: true,
        initialDelay: 100 // Delay for initial beep in ms
    }
};

// Helper function to format time for logging
export function formatBeepTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Helper function to get beep times for an apparatus
export function getBeepTimesForApparatus(apparatus) {
    return beepConfig.timingBeeps[apparatus] || [];
}

// Helper function to check if apparatus should have initial beep
export function shouldHaveInitialBeep(apparatus) {
    return beepConfig.initialBeepApparatus.includes(apparatus);
}

// Helper function to check if should beep at specific time
export function shouldBeepAtTime(apparatus, seconds) {
    const beepTimes = getBeepTimesForApparatus(apparatus);
    return beepTimes.includes(seconds);
}

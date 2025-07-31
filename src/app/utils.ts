
export const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let result = '';
    if (hours > 0) {
        result += `${hours} hr `;
    }
    if (minutes > 0 || hours === 0) {
        result += `${minutes} min`;
    }
    return result.trim();
};

export const formatDistance = (meters: number): string => {
    const kilometers = meters / 1000;
    return `${kilometers.toFixed(1)} km`;
};

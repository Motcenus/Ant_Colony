class Ant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hasFood = false;
        this.orientation = Math.random() * 360; // random initial orientation
        this.lastSignalStrength = 0;
    }

    move(grid, gridSize, nest) {
        const i = Math.floor(this.x / gridSize);
        const j = Math.floor(this.y / gridSize);

        if (this.hasFood) {
            // Move towards the nest
            this.moveTowardsNest(grid, i, j, nest);
        } else {
            // Search for food
            this.searchForFood(grid, i, j);
        }

        // Update position based on new orientation
        this.updatePosition(gridSize);
    }

    moveTowardsNest(grid, i, j, nest) {
        const currentDistance = this.distanceToNest(i, j, nest);
        let newCoords;

        do {
            this.orientation = Math.random() * 360;
            newCoords = this.getNewCoords(i, j, grid.length);
        } while (this.distanceToNest(newCoords[0], newCoords[1], nest) >= currentDistance);

        if (grid[newCoords[0]][newCoords[1]].ant === null) {
            grid[newCoords[0]][newCoords[1]].ant = this;
            grid[i][j].ant = null;
        }
    }

    searchForFood(grid, i, j) {
        let maxSignal = 0;
        let targetCoords = this.getNewCoords(i, j, grid.length);

        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                const ni = i + di;
                const nj = j + dj;

                if (ni >= 0 && nj >= 0 && ni < grid.length && nj < grid.length) {
                    const signal = grid[ni][nj].pheromoneStrength;
                    if (signal > maxSignal) {
                        maxSignal = signal;
                        targetCoords = [ni, nj];
                    }
                }
            }
        }

        if (grid[targetCoords[0]][targetCoords[1]].ant === null) {
            grid[targetCoords[0]][targetCoords[1]].ant = this;
            grid[i][j].ant = null;
        }
    }

    updatePosition(gridSize) {
        this.x += Math.cos(this.orientation) * gridSize;
        this.y += Math.sin(this.orientation) * gridSize;
    }

    distanceToNest(i, j, nest) {
        return Math.sqrt(Math.pow(nest.x - i, 2) + Math.pow(nest.y - j, 2));
    }

    getNewCoords(i, j, gridLength) {
        const ni = Math.max(0, Math.min(gridLength - 1, i + Math.round(Math.cos(this.orientation))));
        const nj = Math.max(0, Math.min(gridLength - 1, j + Math.round(Math.sin(this.orientation))));
        return [ni, nj];
    }
}

export { Ant };

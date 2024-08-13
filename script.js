// Simulation configuration
var grid_length = 10;
var grid = [];
var temp_grid = [];
var population = [];
var max_ants_on_grid = 10;
var ms_between_updates = 33;
var ants_out_of_nest = 0;
var _data; // Store data from previous update

// Extend Math with degree-radian conversion functions
Math.to_radians = function(degrees) {
    return degrees * Math.PI / 180;
};
Math.to_degrees = function(radians) {
    return radians * 180 / Math.PI;
};

// Cell object representing each grid cell
function Cell(i, ii) {
    this.i = i;
    this.ii = ii;
    this.ant = null;
    this.food = 0;
    this.signal = 0;
    this.has_ant = function() {
        return this.ant ? true : false;
    };
}

// Ant object representing each ant
function Ant() {
    this.has_food = false;
    this.last_signal = 0;
    this.orientation = Math.random() * 90;
}

// Initialize the grid
function init_grids() {
    for (var i = 0; i < grid_length; i++) {
        grid[i] = [];
        temp_grid[i] = [];
        for (var ii = 0; ii < grid_length; ii++) {
            grid[i][ii] = new Cell(i, ii);
            temp_grid[i][ii] = new Cell(i, ii);
        }
    }
}

// Initialize the simulation
function initialize_simulation() {
    init_grids();
    place_food();
    draw_grid(grid.map(function(row) { return row.map(function(cell) { return cell; }); }));
}

// Run simulation and update visualization
function simulate_and_visualize() {
    run_time_step();
    update_grid(grid.map(function(row) { return row.map(function(cell) { return cell; }); }));
}

// Place food on the grid
function place_food() {
    var center_i = Math.round(grid_length * 0.8);
    var center_ii = center_i;
    var max_distance = grid_length / 10;
    for (var i = center_i - max_distance; i <= center_i + max_distance; i++) {
        for (var ii = center_ii - max_distance; ii < center_ii + max_distance; ii++) {
            var bounded_i = get_bounded_index(i);
            var bounded_ii = get_bounded_index(ii);
            var distance = calc_distance(center_i, center_ii, bounded_i, bounded_ii);
            var food_level = Math.round(10 - Math.pow(distance, 1.2));
            grid[i][ii].food = food_level;
        }
    }
}

// Run a time step of the simulation
function run_time_step() {
    move_ants();
    check_for_food();
    sense_signal();
}

// Move ants based on the simulation logic
function move_ants() {
    for (var i = 0; i < grid_length; i++) {
        for (var ii = 0; ii < grid_length; ii++) {
            if (grid[i][ii].has_ant()) {
                move_ant(i, ii);
            }
        }
    }
    update_signals();
    move_ant_out_of_nest();
}

// Update pheromone signals on the grid
function update_signals() {
    for (var i = 0; i < grid_length; i++) {
        for (var ii = 0; ii < grid_length; ii++) {
            grid[i][ii].ant = temp_grid[i][ii].ant;
            if (grid[i][ii].has_ant() && grid[i][ii].ant.has_food) {
                var signal_strength = 1 - Math.pow(0.5, 1 / calc_distance(i, ii, 0, 0));
                grid[i][ii].signal += signal_strength;
                if (i < 5 && ii < 5) {
                    grid[i][ii].ant.has_food = false;
                }
            } else {
                grid[i][ii].signal *= 0.95;
            }
            if (grid[i][ii].signal < 0.05) {
                grid[i][ii].signal = 0;
            }
        }
    }
}

// Move an ant out of the nest
function move_ant_out_of_nest() {
    var i = 0;
    var ii = 0;
    var new_coords = get_random_coordinates(i, ii);
    var j = new_coords[0];
    var jj = new_coords[1];
    if (!grid[j][jj].has_ant() && ants_out_of_nest < max_ants_on_grid) {
        grid[j][jj].ant = new Ant();
        temp_grid[j][jj].ant = grid[j][jj].ant;
        ants_out_of_nest++;
    }
}

// Calculate the next position for an ant based on its orientation
function move_ant(i, ii) {
    var new_coords, j, jj;
    if (grid[i][ii].ant.has_food) {
        var current_distance = calc_distance_to_nest(i, ii);
        do {
            grid[i][ii].ant.orientation = Math.random() * 360;
            new_coords = get_coords_from_orientation(i, ii);
            j = new_coords[0];
            jj = new_coords[1];
        } while (calc_distance_to_nest(j, jj) >= current_distance);
    } else {
        new_coords = get_coords_from_orientation(i, ii);
        j = new_coords[0];
        jj = new_coords[1];
        grid[i][ii].ant.orientation += Math.random() * 45 - 22.5;

        var last = grid[i][ii].ant.last_signal;
        var min = 0;
        var max = 0;
        for (var n_i = i - 1; n_i <= i + 1; n_i++) {
            for (var n_ii = ii - 1; n_ii <= ii + 1; n_ii++) {
                var bounded_n_i = get_bounded_index(n_i);
                var bounded_n_ii = get_bounded_index(n_ii);
                var current = grid[bounded_n_i][bounded_n_ii].signal;
                if (current.signal == 0) {
                    continue;
                }
                var diff = last - current;
                if (last == 0) {
                    if (diff < min) {
                        j = bounded_n_i;
                        jj = bounded_n_ii;
                    }
                } else {
                    if (diff > max) {
                        j = bounded_n_i;
                        jj = bounded_n_ii;
                    }
                }
            }
        }
    }
    if (Math.random() < 0.05) {
        new_coords = get_random_coordinates(i, ii);
        j = new_coords[0];
        jj = new_coords[1];
    }
    if (!temp_grid[j][jj].has_ant()) {
        temp_grid[j][jj].ant = temp_grid[i][ii].ant;
        temp_grid[i][ii].ant = null;
    }
}

// Check if ants found food and update grid
function check_for_food() {
    for (var i = 0; i < grid_length; i++) {
        for (var ii = 0; ii < grid_length; ii++) {
            if (grid[i][ii].has_ant() && !grid[i][ii].ant.has_food) {
                if (grid[i][ii].food > 0) {
                    grid[i][ii].ant.has_food = true;
                    grid[i][ii].food--;
                }
            }
        }
    }
}

// Sense and record pheromone signals
function sense_signal() {
    for (var i = 0; i < grid_length; i++) {
        for (var ii = 0; ii < grid_length; ii++) {
            if (grid[i][ii].has_ant()) {
                grid[i][ii].ant.last_signal = grid[i][ii].signal;
            }
        }
    }
}

// Calculate distance between two points
function calc_distance(i, ii, j, jj) {
    return Math.pow(Math.pow(Math.abs(i - j), 2) + Math.pow(Math.abs(ii - jj), 2), 0.5);
}

// Calculate distance from the nest
function calc_distance_to_nest(i, ii) {
    return calc_distance(i, ii, 0, 0);
}

// Get random coordinates within a specified range
function get_random_coordinates(i, ii) {
    var j = get_random_int(i - 1, i + 1);
    var jj = get_random_int(ii - 1, ii + 1);
    j = get_bounded_index(j);
    jj = get_bounded_index(jj);
    return [j, jj];
}

// Get bounded index to ensure coordinates remain within the grid
function get_bounded_index(index) {
    if (index < 0) return 0;
    if (index >= grid_length) return grid_length - 1;
    return index;
}

// Generate a random integer between min and max (inclusive)
function get_random_int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Draw the grid on a canvas
function draw_grid(data) {
    var width = 600;
    var height = 600;
    var grid_length = data.length;
    var width_cell = width / grid_length;
    var height_cell = height / grid_length;

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);

    var signal_level;
    var food_level;
    for (var i = 0; i < grid_length; i++) {
        for (var ii = 0; ii < grid_length; ii++) {
            context.beginPath();
            context.rect(i * width_cell, ii * height_cell, width_cell, height_cell);
            signal_level = Math.pow(data[i][ii].signal / 4, 0.5);
            food_level = data[i][ii].food;
            if (data[i][ii].has_ant()) {
                if (data[i][ii].ant.has_food) {
                    context.fillStyle = 'rgb(159,248,101)';
                } else {
                    context.fillStyle = 'rgb(0,0,0)';
                }
            } else if (food_level > 0) {
                context.fillStyle = 'rgba(86,169,46,' + food_level / 10 + ')';
            } else if (signal_level > 0) {
                context.fillStyle = 'rgba(0,0,0,' + signal_level + ')';
            } else {
                context.fillStyle = 'rgba(255,255,255,0.1)';
            }
            context.fill();
            context.stroke();
        }
    }
}

// Update the grid visualization
function update_grid(data) {
    draw_grid(data);
}

// Get coordinates based on ant orientation
function get_coords_from_orientation(i, ii) {
    var orientation_radians = Math.to_radians(grid[i][ii].ant.orientation);
    return [get_bounded_index(Math.round(i + Math.cos(orientation_radians))), get_bounded_index(Math.round(ii + Math.sin(orientation_radians)))];
}

// Start the simulation and visualization loop
initialize_simulation();
setInterval(simulate_and_visualize, ms_between_updates);

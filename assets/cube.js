class Cube {
    
    constructor() {
        this.colors = ['red', 'blue', 'orange', 'green', 'white', 'yellow'];
        this.NUM_FACES = 6;
        this.CELL_SIZE = 20;
        this.FACE_SIZE = this.CELL_SIZE * 3;

        this.cube = this.initCube();
    }

    initCube() {
        var cube = [];
        for (var f = 0; f < this.NUM_FACES; f++) {
            cube[f] = [];
            for (var r = 0; r < 3; r++) {
                cube[f][r] = [];
                for (var c = 0; c < 3; c++) {
                    cube[f][r][c] = this.colors[f];
                }
            }
        }
        return cube;
    }

    drawCube(ctx, x, y) {
        for (var f = 0; f < this.colors.length; f++) {
            var loc = this.determineFaceLocation(f, x, y);
            this.drawFace(ctx, f, loc[0], loc[1]);
        }
    }

    determineFaceLocation(face, x, y) {
        return face < 4 ? [x + (face * this.FACE_SIZE), y + this.FACE_SIZE] :
            face == 4 ?
            [x + this.FACE_SIZE, y] :
            [x + this.FACE_SIZE, y + (2 * this.FACE_SIZE)]
    }

    drawFace(ctx, face, x, y) {
        ctx.setLineDash([5, 3]);
        var CS = this.CELL_SIZE;

        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                ctx.fillStyle = this.cube[face][i][j];
                ctx.fillRect(x + (j*CS), y + (i*CS), CS, CS);
                ctx.strokeRect(x + (j*CS), y + (i*CS), CS, CS);
            }
        }

        ctx.setLineDash([]);
        ctx.strokeRect(x, y, CS*3, CS*3);
    }

    rotateFace(face, cw=true) {
        var n_face = new Array([0,0,0], [0,0,0], [0,0,0]);
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                cw ? n_face[j][2 - i] = this.cube[face][i][j] :
                    n_face[2 - i][j] = this.cube[face][j][i];
            }
        }

        this.cube[face] = n_face;
        this.rotateAdjacentTo(face, cw);
    }

    rotateAdjacentTo(face, cw=true) {

        var f_combined = new Array();

        if (face < 4) { // Handle only the middle row of faces.
            var f_left = face - 1 > -1 ? this.cube[face - 1] : this.cube[3];
            var f_right = face + 1 < 4 ? this.cube[face + 1] : this.cube[0];
            var f_top = this.cube[4];
            var f_bottom = this.cube[5];
            f_combined["top"] = face % 2 == 0 ? this.getColumn(f_top, face) : Array.from(f_top[3 - face]);
            f_combined["right"] = this.getColumn(f_right, 0);
            f_combined["bottom"] = face % 2 == 0 ? this.getColumn(f_bottom, face) :
                Array.from(f_bottom[face - 1]);
            f_combined["left"] = this.getColumn(f_left, 2);

            if (face == 0) { // Red face
                for (var i = 0; i < 3; i++) {
                    f_right[i][0] = f_combined[cw ? "top" : "bottom"][i];
                    f_bottom[cw ? i : 2-i][0] = f_combined[cw ? "right" : "left"][i];
                    f_left[2-i][2] = f_combined[cw ? "bottom" : "top"][i];
                    f_top[cw ? 2-i : i][0] = f_combined[cw ? "left" : "right"][i];
                }
            } else if (face == 1) { // Blue face
                for (var i = 0; i < 3; i++) {
                    f_right[cw ? i : 2-i][0] = f_combined[cw ? "top" : "bottom"][i];
                    f_bottom[0][cw ? 2-i : i] = f_combined[cw ? "right" : "left"][i];
                    f_left[cw ? i : 2-i][2] = f_combined[cw ? "bottom" : "top"][i];
                    f_top[2][cw ? 2-i : i] = f_combined[cw ? "left" : "right"][i];
                }
            } else if (face == 2) { // Orange face
                for (var i = 0; i < 3; i++) {
                    f_right[2-i][0] = f_combined[cw ? "top" : "bottom"][i];
                    f_bottom[cw ? 2-i : i][2] = f_combined[cw ? "right" : "left"][i];
                    f_left[i][2] = f_combined[cw ? "bottom" : "top"][i];
                    f_top[cw ? i : 2-i][2] = f_combined[cw ? "left" : "right"][i];
                }
            } else if (face == 3) { // Green face
                for (var i = 0; i < 3; i++) {
                    f_right[cw ? 2-i : i][0] = f_combined[cw ? "top" : "bottom"][i];
                    f_bottom[2][cw ? i : 2-i] = f_combined[cw ? "right" : "left"][i];
                    f_left[cw ? 2-i : i][2] = f_combined[cw ? "bottom" : "top"][i];
                    f_top[0][cw ? i : 2-i] = f_combined[cw ? "left" : "right"][i];
                }
            }
        } else { // Handle the top and bottom faces.
            var f_left = this.cube[0];
            var f_right = this.cube[2];
            var f_top = face == 4 ? this.cube[3] : this.cube[1];
            var f_bottom = face == 4 ? this.cube[1] : this.cube[3];
            f_combined["top"] = Array.from(f_top[face == 4 ? 0 : 2]);
            f_combined["bottom"] = Array.from(f_bottom[face == 4 ? 0 : 2]);
            f_combined["right"] = Array.from(f_right[face == 4 ? 0 : 2]); 
            f_combined["left"] = Array.from(f_left[face == 4 ? 0 : 2]);

            for (var i = 0; i < 3; i++) {
                f_right[face == 4 ? 0 : 2][i] = f_combined[cw ? "top" : "bottom"][i];
                f_bottom[face == 4 ? 0 : 2][i] = f_combined[cw ? "right" : "left"][i];
                f_left[face == 4 ? 0 : 2][i] = f_combined[cw ? "bottom" : "top"][i];
                f_top[face == 4 ? 0 : 2][i] = f_combined[cw ? "left" : "right"][i];
            }
        }
    }

    getColumn(face, i) {
        return [face[0][i],face[1][i],face[2][i]];
    }

    setColor(orig_left, orig_top, x, y, color) {
        var found_face = null;

        for (var f = 0; f < this.colors.length; f++) {
            var pos = this.determineFaceLocation(f, orig_left, orig_top);
            if ((x >= pos[0] && x <= pos[0] + this.FACE_SIZE) &&
                (y >= pos[1] && y <= pos[1] + this.FACE_SIZE)) {
                found_face = f;
                break;
            }
        }

        if (found_face != null) {
            var i = Math.floor((y - pos[1]) / this.CELL_SIZE);
            var j = Math.floor((x - pos[0])  / this.CELL_SIZE);

            if (i == 1 && j == 1)
                return;  // Don't change center cell.

            this.cube[f][i][j] = color;
        }
    }

    shuffle(num_rotations = 50) {
        for (let i = 0; i < num_rotations; i++) {
            let cw = Math.round(Math.random()) == 0 ? false : true;
            let face = Math.floor(Math.random() * this.NUM_FACES);
            this.rotateFace(face, cw);
        }
    }
}

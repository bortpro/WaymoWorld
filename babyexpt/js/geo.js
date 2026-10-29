// GeometryBatch: accumulates triangles for one material and builds a single merged mesh.
// Merging the whole city into a handful of meshes keeps draw calls tiny (the main reason the
// three.js version runs fast), so we can spend the GPU budget on lighting and post-processing.
//
// All helpers take faces wound counter-clockwise as seen from OUTSIDE (right-hand rule gives the
// outward normal). Babylon's front faces are clockwise, so indices are emitted reversed.

// Chunked batches split their triangles into CHUNK x CHUNK metre tiles, one mesh per tile, so the
// camera and every shadow cascade can frustum-cull the city instead of drawing all of it.
const CHUNK = 300;

export class GeometryBatch {
    constructor(name, { colors = false, chunked = false } = {}) {
        this.name = name;
        this.hasColors = colors;
        this.chunked = chunked;
        this.parts = new Map();
        this.locked = false;
        this.color = [1, 1, 1, 1];
        this._select(0, 0);
    }

    _select(x, z) {
        if (this.locked) return;
        const key = this.chunked ? Math.floor((x + 600) / CHUNK) + ',' + Math.floor((z + 600) / CHUNK) : 'all';
        let p = this.parts.get(key);
        if (!p) {
            p = { positions: [], normals: [], uvs: [], colors: this.hasColors ? [] : null, indices: [] };
            this.parts.set(key, p);
        }
        this.cur = p;
    }

    get vertexCount() { return this.cur.positions.length / 3; }
    get indices() { return this.cur.indices; }

    setColor(r, g, b, a = 1) { this.color = [r, g, b, a]; return this; }

    vertex(p, n, u, v) {
        const c = this.cur;
        c.positions.push(p.x, p.y, p.z);
        c.normals.push(n.x, n.y, n.z);
        c.uvs.push(u, v);
        if (c.colors) c.colors.push(...this.color);
        return c.positions.length / 3 - 1;
    }

    // Triangle (a, b, c) CCW from outside
    tri(a, b, c, uva = [0, 0], uvb = [1, 0], uvc = [0, 1], normal = null) {
        this._select(a.x, a.z);
        const n = normal || BABYLON.Vector3.Cross(b.subtract(a), c.subtract(a)).normalize();
        const i0 = this.vertex(a, n, uva[0], uva[1]);
        const i1 = this.vertex(b, n, uvb[0], uvb[1]);
        const i2 = this.vertex(c, n, uvc[0], uvc[1]);
        this.indices.push(i0, i2, i1);
    }

    // Quad a-b-c-d CCW from outside (a bottom-left, b bottom-right, c top-right, d top-left)
    quad(a, b, c, d, uv = [0, 0, 1, 1], normal = null) {
        this._select(a.x, a.z);
        const n = normal || BABYLON.Vector3.Cross(b.subtract(a), d.subtract(a)).normalize();
        const [u0, v0, u1, v1] = uv;
        const i0 = this.vertex(a, n, u0, v0);
        const i1 = this.vertex(b, n, u1, v0);
        const i2 = this.vertex(c, n, u1, v1);
        const i3 = this.vertex(d, n, u0, v1);
        this.indices.push(i0, i2, i1, i0, i3, i2);
    }

    // Vertical wall from p0 to p1 (ground points, CCW order along the outline when viewed from
    // above means the wall faces outward to the right of travel). UVs in world units / scale.
    wall(x0, z0, x1, z1, yBottom, yTop, uScale, vScale, uOffset = 0, vOrigin = yBottom) {
        const len = Math.hypot(x1 - x0, z1 - z0);
        const a = new BABYLON.Vector3(x0, yBottom, z0);
        const b = new BABYLON.Vector3(x1, yBottom, z1);
        const c = new BABYLON.Vector3(x1, yTop, z1);
        const d = new BABYLON.Vector3(x0, yTop, z0);
        this.quad(a, b, c, d, [
            uOffset / uScale, (yBottom - vOrigin) / vScale,
            (uOffset + len) / uScale, (yTop - vOrigin) / vScale,
        ]);
    }

    // Axis-aligned box with world-scaled UVs on every face. rotY rotates around the box centre.
    box(cx, cy, cz, sx, sy, sz, { uv = 1, rotY = 0, top = true, bottom = false, vOrigin = null, fixedUV = null } = {}) {
        const hx = sx / 2, hy = sy / 2, hz = sz / 2;
        const c = Math.cos(rotY), s = Math.sin(rotY);
        const P = (x, y, z) => new BABYLON.Vector3(cx + x * c + z * s, cy + y, cz - x * s + z * c);
        const y0 = -hy, y1 = hy;
        const vo = vOrigin === null ? 0 : (vOrigin - cy);
        const sideUV = fixedUV ? () => [fixedUV[0], fixedUV[1], fixedUV[0], fixedUV[1]]
            : (len) => [0, (y0 - vo) / uv, len / uv, (y1 - vo) / uv];
        const capUV = fixedUV ? [fixedUV[0], fixedUV[1], fixedUV[0], fixedUV[1]] : [0, 0, sx / uv, sz / uv];
        // +z face, -z face, +x face, -x face (CCW from outside)
        this.quad(P(-hx, y0, hz), P(hx, y0, hz), P(hx, y1, hz), P(-hx, y1, hz), sideUV(sx));
        this.quad(P(hx, y0, -hz), P(-hx, y0, -hz), P(-hx, y1, -hz), P(hx, y1, -hz), sideUV(sx));
        this.quad(P(hx, y0, hz), P(hx, y0, -hz), P(hx, y1, -hz), P(hx, y1, hz), sideUV(sz));
        this.quad(P(-hx, y0, -hz), P(-hx, y0, hz), P(-hx, y1, hz), P(-hx, y1, -hz), sideUV(sz));
        if (top) this.quad(P(-hx, y1, hz), P(hx, y1, hz), P(hx, y1, -hz), P(-hx, y1, -hz), capUV);
        if (bottom) this.quad(P(-hx, y0, -hz), P(hx, y0, -hz), P(hx, y0, hz), P(-hx, y0, hz), capUV);
    }

    // Four-sided pyramid / hip roof over an axis-aligned rectangle
    hipRoof(cx, cz, yBase, sx, sz, height, ridge = 0, uv = 4, overhang = 0.6) {
        const hx = sx / 2 + overhang, hz = sz / 2 + overhang;
        const r = Math.min(ridge, sx - 1) / 2;
        const P = (x, y, z) => new BABYLON.Vector3(cx + x, y, cz + z);
        const yt = yBase + height;
        const a = P(-hx, yBase, hz), b = P(hx, yBase, hz), c = P(hx, yBase, -hz), d = P(-hx, yBase, -hz);
        const r0 = P(-r, yt, 0), r1 = P(r, yt, 0);
        const slopeZ = Math.hypot(hz, height), slopeX = Math.hypot(hx - r, height);
        // front (+z) and back (-z) trapezoids, sides triangles
        this.quad(a, b, r1, r0, [0, 0, (2 * hx) / uv, slopeZ / uv]);
        this.quad(c, d, r0, r1, [0, 0, (2 * hx) / uv, slopeZ / uv]);
        this.tri(b, c, r1, [0, 0], [(2 * hz) / uv, 0], [hz / uv, slopeX / uv]);
        this.tri(d, a, r0, [0, 0], [(2 * hz) / uv, 0], [hz / uv, slopeX / uv]);
        // soffit underneath the overhang
        this.quad(P(-hx, yBase, -hz), P(hx, yBase, -hz), P(hx, yBase, hz), P(-hx, yBase, hz), [0, 0, 1, 1],
            new BABYLON.Vector3(0, -1, 0));
    }

    // Horizontal grid draped over a height function (terrain-following slabs, lawns, markings)
    drapedGrid(x0, z0, x1, z1, nx, nz, heightFn, uvScale = 1, colorFn = null) {
        this._select(x0, z0);
        const base = this.vertexCount;
        for (let j = 0; j <= nz; j++) {
            for (let i = 0; i <= nx; i++) {
                const x = x0 + (x1 - x0) * i / nx, z = z0 + (z1 - z0) * j / nz;
                const y = heightFn(x, z);
                const e = 0.5;
                const nrm = new BABYLON.Vector3(heightFn(x - e, z) - heightFn(x + e, z), 2 * e,
                    heightFn(x, z - e) - heightFn(x, z + e)).normalize();
                if (colorFn) this.color = colorFn(x, z, y);
                this.vertex(new BABYLON.Vector3(x, y, z), nrm, x / uvScale, z / uvScale);
            }
        }
        const row = nx + 1;
        for (let j = 0; j < nz; j++) {
            for (let i = 0; i < nx; i++) {
                const a = base + j * row + i, b = a + 1, c = a + row + 1, d = a + row;
                // Up-facing: CCW from above is a -> d -> c -> b in this (x right, z down) layout
                this.indices.push(a, b, c, a, c, d);
            }
        }
    }

    // A flat strip lying on the terrain between two points (road paint)
    drapedStrip(x0, z0, x1, z1, width, heightFn, lift = 0.05, step = 4) {
        const len = Math.hypot(x1 - x0, z1 - z0);
        const n = Math.max(1, Math.ceil(len / step));
        const dx = (x1 - x0) / len, dz = (z1 - z0) / len;
        const px = -dz * width / 2, pz = dx * width / 2;
        this._select(x0, z0);
        const base = this.vertexCount;
        const up = new BABYLON.Vector3(0, 1, 0);
        for (let i = 0; i <= n; i++) {
            const t = i / n;
            const cx = x0 + (x1 - x0) * t, cz = z0 + (z1 - z0) * t;
            for (const side of [-1, 1]) {
                const x = cx + px * side, z = cz + pz * side;
                this.vertex(new BABYLON.Vector3(x, heightFn(x, z) + lift, z), up, side < 0 ? 0 : 1, t * len / 4);
            }
        }
        for (let i = 0; i < n; i++) {
            const a = base + i * 2, b = a + 1, c = a + 3, d = a + 2;
            this.indices.push(a, b, c, a, c, d);
            this.indices.push(a, c, b, a, d, c); // both windings so the strip shows whatever the direction
        }
    }

    // Wall whose bottom and top follow per-end heights (curbs, cliff skirts). Faces right of travel.
    slopedWall(x0, z0, x1, z1, b0, b1, t0, t1, uvScale = 1) {
        const len = Math.hypot(x1 - x0, z1 - z0);
        this.quad(new BABYLON.Vector3(x0, b0, z0), new BABYLON.Vector3(x1, b1, z1),
            new BABYLON.Vector3(x1, t1, z1), new BABYLON.Vector3(x0, t0, z0),
            [0, b0 / uvScale, len / uvScale, t0 / uvScale]);
    }

    // Closed ring surface: rings[k] = array of points (same count), bottom to top. u = arc length / uScale
    lathe(rings, uScale, vScale, closed = true) {
        for (let k = 0; k < rings.length - 1; k++) {
            const r0 = rings[k], r1 = rings[k + 1];
            let u = 0;
            const n = closed ? r0.length : r0.length - 1;
            for (let i = 0; i < n; i++) {
                const j = (i + 1) % r0.length;
                const seg = BABYLON.Vector3.Distance(r0[i], r0[j]);
                this.quad(r0[i], r0[j], r1[j], r1[i], [u / uScale, r0[i].y / vScale, (u + seg) / uScale, r1[i].y / vScale]);
                u += seg;
            }
        }
    }

    // Unchunked batches return one mesh (or null); chunked batches return an array of meshes
    build(scene, material, { receiveShadows = true, castShadows = true, pickable = false } = {}) {
        const meshes = [];
        for (const [key, p] of this.parts) {
            if (!p.indices.length) continue;
            const mesh = new BABYLON.Mesh(this.chunked ? `${this.name}_${key}` : this.name, scene);
            const vd = new BABYLON.VertexData();
            vd.positions = p.positions;
            vd.normals = p.normals;
            vd.uvs = p.uvs;
            if (p.colors) vd.colors = p.colors;
            vd.indices = p.indices;
            vd.applyToMesh(mesh, false);
            mesh.material = material;
            mesh.receiveShadows = receiveShadows;
            mesh.isPickable = pickable;
            mesh.freezeWorldMatrix();
            mesh.metadata = { castShadows };
            meshes.push(mesh);
        }
        if (this.chunked) return meshes;
        return meshes[0] || null;
    }
}

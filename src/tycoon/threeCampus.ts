import * as THREE from "three";
import {
  COLS,
  ROWS,
  PARCELS,
  anchorTiles,
  euro,
  hasTech,
  powerReport,
  roomOnline,
  roomTiles,
  type Game,
  type Room,
  type RoomType,
  type Role,
} from "@/tycoon/model";

export const TILE_SIZE = 2.4;

export interface ThreeCampusOptions {
  onSelectTile: (cell: { c: number; r: number }) => void;
  onSelectRoom: (roomId: string) => void;
  onSelectParcel: (parcelId: string) => void;
}

const ROOM_COLORS: Record<RoomType, { floor: number; wall: number; accent: number; name: string }> = {
  hq: { floor: 0xf5faf7, wall: 0x1b7a64, accent: 0xc88812, name: "Direzione" },
  gown: { floor: 0xedf2f0, wall: 0x4a6b63, accent: 0x1b7a64, name: "Spogliatoio" },
  warehouse: { floor: 0xd4b58e, wall: 0x6e4a28, accent: 0xc88812, name: "Magazzino" },
  quarantine: { floor: 0xebcf8c, wall: 0x8a5818, accent: 0xc88812, name: "Quarantena" },
  cold: { floor: 0xd0ebf7, wall: 0x366885, accent: 0x0284c7, name: "Frigo" },
  shipping: { floor: 0xd9c4ab, wall: 0x6b4f35, accent: 0x8a5a34, name: "Spedizioni" },
  pilot: { floor: 0xecd082, wall: 0xb5780a, accent: 0xc88812, name: "Pilota" },
  plant: { floor: 0xc4d8dc, wall: 0x143b42, accent: 0x0f766e, name: "Impianto" },
  pack: { floor: 0xe8c79e, wall: 0x7a4d29, accent: 0xb45309, name: "Pack" },
  sterile: { floor: 0xe6faf3, wall: 0x0d5c52, accent: 0x10b981, name: "Suite Sterile" },
  qc: { floor: 0xdaf0ca, wall: 0x315c34, accent: 0x1b7a64, name: "Qualità QC" },
  stability: { floor: 0xdcf0d4, wall: 0x3d5c36, accent: 0x16a34a, name: "Stabilità" },
  discovery: { floor: 0xcbece0, wall: 0x10594b, accent: 0x0d9488, name: "Lab Ricerca" },
  preclinical: { floor: 0xbfe4d4, wall: 0x0d4c40, accent: 0x059669, name: "Preclinica" },
  phase1: { floor: 0xdee7f2, wall: 0x324763, accent: 0x2563eb, name: "Clinica Fase I" },
  phase23: { floor: 0xd1e0ee, wall: 0x223650, accent: 0x1d4ed8, name: "Clinica Fase II" },
  regulatory: { floor: 0xf2e8cd, wall: 0x1a2f35, accent: 0xc88812, name: "Regolatorio" },
  power: { floor: 0xcdd5d6, wall: 0x1f3035, accent: 0xf59e0b, name: "Energia" },
  water: { floor: 0xbfe0e8, wall: 0x164c58, accent: 0x06b6d4, name: "Acque" },
};

export class ThreeCampus {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private animFrameId: number | null = null;
  private options: ThreeCampusOptions;

  // Interaction & Camera
  private camTarget = new THREE.Vector3(0, 0, 0);
  private camOffset = new THREE.Vector3(26, 32, 26);
  private currentZoom = 28;
  private isDragging = false;
  private prevPointer = { x: 0, y: 0 };
  private pointerDownPos = { x: 0, y: 0 };
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Scene object groups
  private groundGroup = new THREE.Group();
  private buildingsGroup = new THREE.Group();
  private corridorsGroup = new THREE.Group();
  private propsGroup = new THREE.Group();
  private staffGroup = new THREE.Group();
  private effectsGroup = new THREE.Group();
  private uiOverlayGroup = new THREE.Group();

  // Game state cache
  private currentGame: Game | null = null;
  private selectedRoomId: string | null = null;
  private selectedCell: { c: number; r: number } | null = null;

  // Interactive meshes map
  private interactiveMeshes: THREE.Object3D[] = [];

  constructor(container: HTMLElement, options: ThreeCampusOptions) {
    this.container = container;
    this.options = options;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const aspect = width / height;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdceee7);

    // 2. Camera (True Isometric Orthographic)
    const frustumSize = this.currentZoom;
    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      500
    );
    this.updateCameraPosition();

    // 3. Renderer with antialiasing and shadow maps
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // 5. Add Groups to Scene
    this.scene.add(this.groundGroup);
    this.scene.add(this.corridorsGroup);
    this.scene.add(this.buildingsGroup);
    this.scene.add(this.propsGroup);
    this.scene.add(this.staffGroup);
    this.scene.add(this.effectsGroup);
    this.scene.add(this.uiOverlayGroup);

    // 6. Listeners
    this.setupEventListeners();

    // 7. Start Render Loop
    this.renderLoop = this.renderLoop.bind(this);
    this.renderLoop();
  }

  private setupLighting() {
    // Warm hemisphere ambient
    const hemiLight = new THREE.HemisphereLight(0xd9f3ea, 0xb0cbbd, 0.85);
    this.scene.add(hemiLight);

    // Main directional sunlight with soft shadows
    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(35, 55, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    const d = 40;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0003;
    this.scene.add(sunLight);

    // Soft architectural rim light from opposite side
    const rimLight = new THREE.DirectionalLight(0x7ecbb5, 0.45);
    rimLight.position.set(-25, 20, -35);
    this.scene.add(rimLight);
  }

  private updateCameraPosition() {
    this.camera.position.copy(this.camTarget).add(this.camOffset);
    this.camera.lookAt(this.camTarget);
  }

  public setZoom(factor: number) {
    this.currentZoom = Math.max(16, Math.min(65, this.currentZoom * factor));
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    const aspect = width / height;
    const frustumSize = this.currentZoom;
    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();
  }

  public resetView() {
    if (!this.currentGame) return;
    this.centerOnCampus(this.currentGame);
  }

  private centerOnCampus(game: Game) {
    // Find average position of owned tiles and rooms
    let sumX = 0;
    let sumZ = 0;
    let count = 0;
    for (const r of game.rooms) {
      sumX += (r.c + r.w / 2 - COLS / 2) * TILE_SIZE;
      sumZ += (r.r + r.h / 2 - ROWS / 2) * TILE_SIZE;
      count += 1;
    }
    if (count > 0) {
      this.camTarget.set(sumX / count, 0, sumZ / count);
    } else {
      this.camTarget.set(0, 0, 0);
    }
    this.updateCameraPosition();
  }

  private setupEventListeners() {
    const el = this.renderer.domElement;

    el.addEventListener("pointerdown", (e) => {
      this.isDragging = true;
      this.prevPointer = { x: e.clientX, y: e.clientY };
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("pointermove", (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevPointer.x;
      const dy = e.clientY - this.prevPointer.y;
      this.prevPointer = { x: e.clientX, y: e.clientY };

      // Convert screen delta to isometric ground delta
      const factor = (this.currentZoom / this.container.clientHeight) * 1.35;
      const moveX = (-dx + dy) * 0.7071 * factor;
      const moveZ = (-dx - dy) * 0.7071 * factor;

      this.camTarget.x += moveX;
      this.camTarget.z += moveZ;
      this.updateCameraPosition();
    });

    window.addEventListener("pointerup", (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (dist < 6) {
        this.handleClick(e);
      }
    });

    el.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.12 : 0.89;
        this.setZoom(factor);
      },
      { passive: false }
    );

    window.addEventListener("resize", () => {
      this.resize();
    });
  }

  public resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const frustumSize = this.currentZoom;
    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private handleClick(e: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);

    if (intersects.length > 0) {
      let topHit: THREE.Object3D | null = intersects[0]!.object;
      while (topHit && !topHit.userData.type && topHit.parent) {
        topHit = topHit.parent;
      }
      if (!topHit || !topHit.userData) return;

      const data = topHit.userData;
      if (data.type === "room") {
        this.options.onSelectRoom(data.roomId);
      } else if (data.type === "tile") {
        this.options.onSelectTile({ c: data.c, r: data.r });
      } else if (data.type === "parcel") {
        this.options.onSelectParcel(data.parcelId);
      }
    }
  }

  // ==========================================
  // SYNC & BUILD 3D SCENE
  // ==========================================
  public update(game: Game, selectedRoomId: string | null, selectedCell: { c: number; r: number } | null) {
    const isFirstLoad = !this.currentGame;
    this.currentGame = game;
    this.selectedRoomId = selectedRoomId;
    this.selectedCell = selectedCell;

    if (isFirstLoad) {
      this.centerOnCampus(game);
    }

    this.rebuildScene();
  }

  private clearGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const obj = group.children[0]!;
      group.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
    }
  }

  private rebuildScene() {
    const game = this.currentGame;
    if (!game) return;

    this.interactiveMeshes = [];
    this.clearGroup(this.groundGroup);
    this.clearGroup(this.corridorsGroup);
    this.clearGroup(this.buildingsGroup);
    this.clearGroup(this.propsGroup);
    this.clearGroup(this.staffGroup);
    this.clearGroup(this.effectsGroup);
    this.clearGroup(this.uiOverlayGroup);

    this.buildTerrain(game);
    this.buildCorridors(game);
    this.buildRooms(game);
  }

  // ------------------------------------------
  // TERRAIN & PARCELS
  // ------------------------------------------
  private buildTerrain(game: Game) {
    const slabGeo = new THREE.BoxGeometry(TILE_SIZE * 0.96, 0.25, TILE_SIZE * 0.96);

    const matOwnedLot = new THREE.MeshStandardMaterial({
      color: 0xbedcd0,
      roughness: 0.6,
      metalness: 0.05,
    });
    const matGarden = new THREE.MeshStandardMaterial({
      color: 0x5a9a7a,
      roughness: 0.8,
      metalness: 0.02,
    });
    const matUnowned = new THREE.MeshStandardMaterial({
      color: 0xc8d4ce,
      roughness: 0.85,
      metalness: 0.05,
    });
    const matSelected = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.4,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
    });

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = game.tiles[r]?.[c];
        if (!tile) continue;

        const posX = (c - COLS / 2 + 0.5) * TILE_SIZE;
        const posZ = (r - ROWS / 2 + 0.5) * TILE_SIZE;

        const parcel = PARCELS.find((p) => c >= p.c0 && c < p.c1 && r >= p.r0 && r < p.r1);
        const isOwned = !!parcel && game.owned.includes(parcel.id);
        const isSelected = !!this.selectedCell && this.selectedCell.c === c && this.selectedCell.r === r;

        let mat = isOwned ? (tile.ground === "garden" ? matGarden : matOwnedLot) : matUnowned;
        if (isSelected && !tile.roomId) mat = matSelected;

        const slab = new THREE.Mesh(slabGeo, mat);
        slab.position.set(posX, -0.125, posZ);
        slab.receiveShadow = true;
        slab.userData = { type: "tile", c, r, parcelId: parcel?.id };
        this.groundGroup.add(slab);
        this.interactiveMeshes.push(slab);

        // Add 3D Stylized Trees on garden tiles or perimeter
        if (tile.ground === "garden" && isOwned) {
          if ((c + r) % 2 === 0) {
            this.createStylizedTree(posX, 0, posZ);
          }
        }
      }
    }

    // Build unowned parcel signs
    for (const p of PARCELS) {
      if (game.owned.includes(p.id)) continue;
      if (!p.touch.some((id) => game.owned.includes(id))) continue;

      const centerX = ((p.c0 + p.c1) / 2 - COLS / 2) * TILE_SIZE;
      const centerZ = ((p.r0 + p.r1) / 2 - ROWS / 2) * TILE_SIZE;

      this.createParcelSign(centerX, 0.1, centerZ, p.id, p.name, euro(p.cost));
    }
  }

  private createStylizedTree(x: number, y: number, z: number) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.8, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4028, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.4;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Foliage canopy (layered low-poly spheres)
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1f7a55, roughness: 0.6 });
    const sphere1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), foliageMat);
    sphere1.position.y = 1.0;
    sphere1.castShadow = true;
    treeGroup.add(sphere1);

    const sphere2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 1), new THREE.MeshStandardMaterial({ color: 0x186b4a, roughness: 0.6 }));
    sphere2.position.set(0.18, 1.35, -0.1);
    sphere2.castShadow = true;
    treeGroup.add(sphere2);

    this.groundGroup.add(treeGroup);
  }

  private createParcelSign(x: number, y: number, z: number, id: string, name: string, costStr: string) {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, y, z);
    signGroup.userData = { type: "parcel", parcelId: id };

    // Post
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x243238, roughness: 0.5 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 0.6;
    post.castShadow = true;
    signGroup.add(post);

    // Plaque billboard
    const boardGeo = new THREE.BoxGeometry(2.4, 0.9, 0.12);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xfdfdfd,
      roughness: 0.3,
      emissive: 0xc88812,
      emissiveIntensity: 0.15,
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 1.25;
    board.castShadow = true;
    signGroup.add(board);

    // Yellow accent banner
    const accent = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.9, 0.13),
      new THREE.MeshBasicMaterial({ color: 0xc88812 })
    );
    accent.position.set(-1.14, 1.25, 0);
    signGroup.add(accent);

    this.groundGroup.add(signGroup);
    this.interactiveMeshes.push(board);
  }

  // ------------------------------------------
  // CORRIDORS & LOGISTICS CONDUITS
  // ------------------------------------------
  private buildCorridors(game: Game) {
    const corridorMat = new THREE.MeshStandardMaterial({
      color: 0xf0ebe1,
      roughness: 0.3,
      metalness: 0.1,
    });
    const conduitGlowMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
    });

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = game.tiles[r]?.[c];
        if (!tile || !tile.corridor || tile.roomId) continue;

        const posX = (c - COLS / 2 + 0.5) * TILE_SIZE;
        const posZ = (r - ROWS / 2 + 0.5) * TILE_SIZE;

        // Elevated walkway floor
        const walkFloor = new THREE.Mesh(
          new THREE.BoxGeometry(TILE_SIZE * 0.88, 0.14, TILE_SIZE * 0.88),
          corridorMat
        );
        walkFloor.position.set(posX, 0.07, posZ);
        walkFloor.receiveShadow = true;
        this.corridorsGroup.add(walkFloor);

        // Center green energy / logistics conduit strip
        const conduit = new THREE.Mesh(
          new THREE.BoxGeometry(TILE_SIZE * 0.22, 0.16, TILE_SIZE * 0.88),
          conduitGlowMat
        );
        conduit.position.set(posX, 0.08, posZ);
        this.corridorsGroup.add(conduit);
      }
    }
  }

  // ------------------------------------------
  // CLEANROOM BUILDINGS & EQUIPMENT
  // ------------------------------------------
  private buildRooms(game: Game) {
    const power = powerReport(game);

    for (const room of game.rooms) {
      this.buildSingleRoom(game, room, power.off);
    }
  }

  private buildSingleRoom(game: Game, room: Room, unpoweredList: { roomId: string; index: number }[]) {
    const meta = ROOM_COLORS[room.type] || ROOM_COLORS.pilot;
    const online = roomOnline(game, room);
    const isSelected = this.selectedRoomId === room.id;

    const roomW = room.w * TILE_SIZE;
    const roomD = room.h * TILE_SIZE;
    const posX = (room.c + room.w / 2 - COLS / 2) * TILE_SIZE;
    const posZ = (room.r + room.h / 2 - ROWS / 2) * TILE_SIZE;

    const roomRoot = new THREE.Group();
    roomRoot.position.set(posX, 0, posZ);
    roomRoot.userData = { type: "room", roomId: room.id };

    // 1. HIGH-GLOSS CLEANROOM FLOOR SLAB
    const floorGeo = new THREE.BoxGeometry(roomW * 0.97, 0.16, roomD * 0.97);
    const floorMat = new THREE.MeshStandardMaterial({
      color: online ? meta.floor : 0x8a9e97,
      roughness: 0.18,
      metalness: 0.12,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = 0.08;
    floorMesh.receiveShadow = true;
    floorMesh.userData = { type: "room", roomId: room.id };
    roomRoot.add(floorMesh);
    this.interactiveMeshes.push(floorMesh);

    // Hazard perimeter tape for pilot and plant
    if (room.type === "pilot" || room.type === "plant") {
      const hazardBorder = new THREE.Mesh(
        new THREE.BoxGeometry(roomW * 0.98, 0.17, roomD * 0.98),
        new THREE.MeshStandardMaterial({ color: 0xc88812, roughness: 0.5 })
      );
      hazardBorder.position.y = 0.075;
      roomRoot.add(hazardBorder);
    }

    // 2. ARCHITECTURAL CUTAWAY CLEANROOM WALLS
    // Rear walls (tall, with glass observation windows)
    const wallHeight = 1.3 + room.level * 0.35;
    const wallThick = 0.16;

    const wallMat = new THREE.MeshStandardMaterial({
      color: online ? meta.wall : 0x3d4e48,
      roughness: 0.35,
      metalness: 0.3,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xd8f5ee,
      transmission: 0.8,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });

    // North wall (back)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.96, wallHeight, wallThick), wallMat);
    northWall.position.set(0, wallHeight / 2 + 0.08, -roomD * 0.48);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    roomRoot.add(northWall);

    // North wall viewing glass inset
    const northGlass = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.72, wallHeight * 0.45, wallThick * 1.1), glassMat);
    northGlass.position.set(0, wallHeight * 0.55 + 0.08, -roomD * 0.48);
    roomRoot.add(northGlass);

    // West wall (back-left)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, roomD * 0.96), wallMat);
    westWall.position.set(-roomW * 0.48, wallHeight / 2 + 0.08, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    roomRoot.add(westWall);

    // Front cutaway walls (low baseboards so machines are 100% visible)
    const frontWallMat = new THREE.MeshStandardMaterial({ color: 0x5a736d, roughness: 0.4 });
    const southLow = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.6, 0.28, wallThick), frontWallMat);
    southLow.position.set(-roomW * 0.15, 0.14 + 0.08, roomD * 0.48);
    roomRoot.add(southLow);

    const eastLow = new THREE.Mesh(new THREE.BoxGeometry(wallThick, 0.28, roomD * 0.6), frontWallMat);
    eastLow.position.set(roomW * 0.48, 0.14 + 0.08, -roomD * 0.15);
    roomRoot.add(eastLow);

    // Level 2 & 3 architectural upgrades (HEPA filtration ceiling ducts & status LED)
    if (room.level >= 2) {
      const ductGeo = new THREE.CylinderGeometry(0.12, 0.12, roomW * 0.92, 8);
      const ductMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.7 });
      const duct = new THREE.Mesh(ductGeo, ductMat);
      duct.rotation.z = Math.PI / 2;
      duct.position.set(0, wallHeight + 0.02, -roomD * 0.44);
      roomRoot.add(duct);
    }

    if (room.level >= 3) {
      // Golden roof trim & cleanroom spotlight gantry
      const gantry = new THREE.Mesh(
        new THREE.BoxGeometry(roomW * 0.98, 0.1, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
      );
      gantry.position.set(0, wallHeight + 0.1, -roomD * 0.48);
      roomRoot.add(gantry);
    }

    // 3. EQUIPMENT & MACHINERY IN SLOTS
    const anchors = anchorTiles(room);
    room.slots.forEach((slot, index) => {
      const tilePos = anchors[index];
      if (!tilePos) return;

      const slotWorldX = (tilePos.c + 0.5 - COLS / 2) * TILE_SIZE - posX;
      const slotWorldZ = (tilePos.r + 0.5 - ROWS / 2) * TILE_SIZE - posZ;

      if (!slot.item) {
        // Holographic empty slot indicator
        this.createEmptySlotMarker(roomRoot, slotWorldX, 0.18, slotWorldZ);
      } else {
        const isGearOff = !online || room.halt > 0 || unpoweredList.some((h) => h.roomId === room.id && h.index === index);
        this.createDetailed3DProp(
          roomRoot,
          slot.item.defId,
          slot.item.mat,
          slot.item.level,
          slotWorldX,
          0.16,
          slotWorldZ,
          !isGearOff
        );
      }
    });

    // 4. STAFF WORKING AT STATIONS
    const crew = game.staff.filter((s) => s.roomId === room.id);
    crew.forEach((staffMember, index) => {
      const anchor = anchors[index % anchors.length];
      const sX = anchor ? (anchor.c + 0.3 - COLS / 2) * TILE_SIZE - posX : (index - 0.5) * 0.8;
      const sZ = anchor ? (anchor.r + 0.3 - ROWS / 2) * TILE_SIZE - posZ : 0;
      this.createStaffAvatar(roomRoot, staffMember.role, sX, 0.16, sZ);
    });

    // 5. SELECTION HIGHLIGHT
    if (isSelected) {
      const box = new THREE.BoxHelper(floorMesh, 0xf59e0b);
      roomRoot.add(box);
    }

    this.buildingsGroup.add(roomRoot);
  }

  // ------------------------------------------
  // PROCEDURAL 3D EQUIPMENT MODELS
  // ------------------------------------------
  private createEmptySlotMarker(parent: THREE.Group, x: number, y: number, z: number) {
    const ringGeo = new THREE.RingGeometry(0.35, 0.45, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, y + 0.01, z);
    parent.add(ring);
  }

  private createDetailed3DProp(
    parent: THREE.Group,
    defId: string,
    matKey: string | undefined,
    level: number,
    x: number,
    y: number,
    z: number,
    isOnline: boolean
  ) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const metalMat = new THREE.MeshStandardMaterial({
      color: isOnline ? 0xe2e8f0 : 0x94a3b8,
      metalness: 0.85,
      roughness: 0.2,
    });

    // A. REATTORE (15L / 50L / 200L / Bioreattore / GMP)
    if (defId === "reattore" || defId === "reattore-gmp" || defId === "bioreattore") {
      const radius = (0.28 + level * 0.08);
      const height = (0.75 + level * 0.35);

      // Steel vessel body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), metalMat);
      body.position.y = height / 2 + 0.15;
      body.castShadow = true;
      group.add(body);

      // Top cap dome
      const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), metalMat);
      dome.position.y = height + 0.15;
      group.add(dome);

      // Support legs
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 6), metalMat);
        leg.position.set(Math.cos(ang) * (radius * 0.85), 0.12, Math.sin(ang) * (radius * 0.85));
        group.add(leg);
      }

      // Glass sight gauge with glowing fluid
      const liquidColor = defId === "bioreattore" ? 0x10b981 : defId === "reattore-gmp" ? 0x06b6d4 : 0xf59e0b;
      const glassGauge = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, height * 0.6, 8),
        new THREE.MeshStandardMaterial({
          color: isOnline ? liquidColor : 0x64748b,
          emissive: isOnline ? liquidColor : 0x000000,
          emissiveIntensity: isOnline ? 0.65 : 0,
          roughness: 0.1,
        })
      );
      glassGauge.position.set(radius * 0.9, height * 0.5 + 0.15, 0);
      group.add(glassGauge);

      // Condenser column for Level 2 & 3
      if (level >= 2) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, height * 1.1, 8), metalMat);
        col.position.set(-radius * 1.05, height * 0.55 + 0.15, 0);
        col.castShadow = true;
        group.add(col);
      }

      // Overhead service catwalk ladder for Level 3 (200L)
      if (level >= 3) {
        const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.12, height + 0.4, 0.04), metalMat);
        ladder.position.set(0, (height + 0.4) / 2, radius * 1.02);
        group.add(ladder);
      }
    }
    // B. SPETTROMETRO HPLC / LC-MS / SINTETIZZATORE
    else if (["hplc", "lcms", "sintetizzatore", "saggi", "monitor-1", "monitor-2"].includes(defId)) {
      // Main analytical tower
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.82, 0.52),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
      );
      tower.position.y = 0.41;
      tower.castShadow = true;
      group.add(tower);

      // LCD Screen with glowing chromatogram
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, 0.22),
        new THREE.MeshBasicMaterial({ color: isOnline ? 0x0284c7 : 0x334155 })
      );
      screen.position.set(0, 0.55, 0.27);
      group.add(screen);

      // Flashing LED status lights
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.02),
        new THREE.MeshBasicMaterial({ color: isOnline ? 0x10b981 : 0xef4444 })
      );
      led.position.set(0.18, 0.72, 0.27);
      group.add(led);
    }
    // C. CAPPA CHIMICA / ISOLATORE
    else if (["cappa", "isolatore", "hvac", "hvacb"].includes(defId)) {
      // Safety cabinet
      const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 1.15, 0.58),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.3 })
      );
      cabinet.position.y = 0.575;
      cabinet.castShadow = true;
      group.add(cabinet);

      // Glass viewing sash
      const sash = new THREE.Mesh(
        new THREE.PlaneGeometry(0.68, 0.55),
        new THREE.MeshPhysicalMaterial({
          color: 0x93c5fd,
          transmission: 0.85,
          transparent: true,
          roughness: 0.05,
        })
      );
      sash.position.set(0, 0.5, 0.3);
      group.add(sash);
    }
    // D. SCAFFALI E RACKS MAGAZZINO (API / SOLVENTE / ECCIPIENTE)
    else if (["scaffale", "imp", "armadietti"].includes(defId)) {
      // Industrial steel rack frame
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.45), frameMat);
      rack.position.y = 0.475;
      rack.castShadow = true;
      group.add(rack);

      // Reagent containers inside
      const bottleColor = matKey === "solvent" ? 0x1e3a8a : matKey === "eccipient" ? 0xf8fafc : 0xb45309;
      for (let i = 0; i < 4; i++) {
        const bottle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 0.18, 8),
          new THREE.MeshStandardMaterial({ color: bottleColor, roughness: 0.2 })
        );
        bottle.position.set(-0.25 + (i % 2) * 0.3, 0.25 + Math.floor(i / 2) * 0.35, 0.15);
        group.add(bottle);
      }
    }
    // E. BLISTERATRICE E CONFEZIONAMENTO
    else if (["blister", "astuccio", "riempimento", "fill-sterile", "baia"].includes(defId)) {
      // Conveyor table
      const table = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.35, 0.45),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.7, roughness: 0.3 })
      );
      table.position.y = 0.25;
      table.castShadow = true;
      group.add(table);

      // Robotic packaging arm / feeder
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
      );
      arm.position.set(0.18, 0.55, 0);
      group.add(arm);
    }
    // F. CENTRALE ELETTRICA E TRASFORMATORE
    else if (defId === "trasformatore" || defId === "generatore") {
      const transformer = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.85, 0.62),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 })
      );
      transformer.position.y = 0.425;
      transformer.castShadow = true;
      group.add(transformer);

      // Copper coils
      const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.2 });
      for (let i = 0; i < 3; i++) {
        const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.28, 8), coilMat);
        coil.position.set(-0.2 + i * 0.2, 0.95, 0);
        group.add(coil);
      }
    }
    // G. DISTILLATORE ACQUE (PW / WFI)
    else if (defId === "pw" || defId === "wfi") {
      const tankGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.15, 16);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.y = 0.6;
      tank.castShadow = true;
      group.add(tank);
    }
    // H. CELLE FRIGO & STABILITA
    else if (["freezer", "freezer-campioni", "climatica"].includes(defId)) {
      const fridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.1, 0.55),
        new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.2, metalness: 0.4 })
      );
      fridge.position.y = 0.55;
      fridge.castShadow = true;
      group.add(fridge);

      // Temperature display
      const led = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 0.1),
        new THREE.MeshBasicMaterial({ color: isOnline ? 0x0284c7 : 0x64748b })
      );
      led.position.set(0, 0.85, 0.28);
      group.add(led);
    }
    // DEFAULT DESK / GENERIC
    else {
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.42, 0.46),
        new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.4 })
      );
      desk.position.y = 0.25;
      desk.castShadow = true;
      group.add(desk);

      // Monitor
      const mon = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.04), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
      mon.position.set(0, 0.55, -0.1);
      group.add(mon);
    }

    parent.add(group);
  }

  // ------------------------------------------
  // STAFF 3D AVATARS
  // ------------------------------------------
  private createStaffAvatar(parent: THREE.Group, role: Role, x: number, y: number, z: number) {
    const avatar = new THREE.Group();
    avatar.position.set(x, y, z);

    let suitColor = 0xffffff;
    if (role === "operator") suitColor = 0x0284c7; // Cleanroom blue
    else if (role === "scientist") suitColor = 0x10b981; // Mint lab coat
    else if (role === "qa") suitColor = 0xf59e0b; // Amber hi-vis vest
    else if (role === "regulatory") suitColor = 0x475569;

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.45, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.32;
    body.castShadow = true;
    avatar.add(body);

    // Head with cleanroom hood/hair
    const headGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.62;
    head.castShadow = true;
    avatar.add(head);

    parent.add(avatar);
  }

  // ------------------------------------------
  // RENDER LOOP & ANIMATIONS
  // ------------------------------------------
  private renderLoop() {
    this.animFrameId = requestAnimationFrame(this.renderLoop);

    // Render frame
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

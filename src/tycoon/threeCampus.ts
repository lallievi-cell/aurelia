import * as THREE from "three";
import {
  COLS,
  ROWS,
  PARCELS,
  anchorTiles,
  canMoveRoom,
  euro,
  hasTech,
  parcelAt,
  powerReport,
  roomDef,
  roomOnline,
  roomTiles,
  type Game,
  type Room,
  type RoomType,
  type Role,
  type MatKey,
} from "@/tycoon/model";

export const TILE_SIZE = 2.4;

export interface ThreeCampusOptions {
  onSelectTile: (cell: { c: number; r: number }) => void;
  onSelectRoom: (roomId: string) => void;
  onSelectParcel: (parcelId: string) => void;
  onMoveRoom?: (roomId: string, targetCell: { c: number; r: number }) => void;
  onDemolishTile?: (cell: { c: number; r: number }) => void;
  onHoverTile?: (cell: { c: number; r: number } | null) => void;
}

const ROOM_THEMES: Record<
  RoomType,
  {
    floor: number;
    wall: number;
    accent: number;
    trim: number;
    name: string;
    motif: "hazard" | "sterile" | "dock" | "clinical" | "office" | "water" | "power";
  }
> = {
  hq: { floor: 0xf5faf7, wall: 0x1b7a64, accent: 0xc88812, trim: 0x8a5a34, name: "Direzione", motif: "office" },
  gown: { floor: 0xedf2f0, wall: 0x4a6b63, accent: 0x1b7a64, trim: 0xd97706, name: "Spogliatoio", motif: "sterile" },
  warehouse: { floor: 0xd4b58e, wall: 0x6e4a28, accent: 0xc88812, trim: 0xf59e0b, name: "Magazzino", motif: "dock" },
  quarantine: { floor: 0xebcf8c, wall: 0x8a5818, accent: 0xd97706, trim: 0x1e293b, name: "Quarantena", motif: "hazard" },
  cold: { floor: 0xd0ebf7, wall: 0x366885, accent: 0x0284c7, trim: 0x93c5fd, name: "Cella Frigo", motif: "sterile" },
  shipping: { floor: 0xd9c4ab, wall: 0x6b4f35, accent: 0x8a5a34, trim: 0xf59e0b, name: "Spedizioni", motif: "dock" },
  pilot: { floor: 0xecd082, wall: 0xb5780a, accent: 0xc88812, trim: 0xf59e0b, name: "Locale Pilota", motif: "hazard" },
  plant: { floor: 0xc4d8dc, wall: 0x143b42, accent: 0x0f766e, trim: 0xf59e0b, name: "Impianto GMP", motif: "hazard" },
  pack: { floor: 0xe8c79e, wall: 0x7a4d29, accent: 0xb45309, trim: 0xc88812, name: "Confezionamento", motif: "dock" },
  sterile: { floor: 0xffffff, wall: 0x0d5c52, accent: 0x10b981, trim: 0x34d399, name: "Suite Sterile", motif: "sterile" },
  qc: { floor: 0xdaf0ca, wall: 0x315c34, accent: 0x1b7a64, trim: 0x10b981, name: "Laboratorio QC", motif: "sterile" },
  stability: { floor: 0xdcf0d4, wall: 0x3d5c36, accent: 0x16a34a, trim: 0x4ade80, name: "Stabilità", motif: "sterile" },
  discovery: { floor: 0xcbece0, wall: 0x10594b, accent: 0x0d9488, trim: 0x14b8a6, name: "Lab Scoperta", motif: "sterile" },
  preclinical: { floor: 0xbfe4d4, wall: 0x0d4c40, accent: 0x059669, trim: 0x10b981, name: "Lab Preclinico", motif: "sterile" },
  phase1: { floor: 0xdee7f2, wall: 0x324763, accent: 0x2563eb, trim: 0x60a5fa, name: "Unità Fase I", motif: "clinical" },
  phase23: { floor: 0xd1e0ee, wall: 0x223650, accent: 0x1d4ed8, trim: 0x3b82f6, name: "Unità Fase II/III", motif: "clinical" },
  regulatory: { floor: 0xf2e8cd, wall: 0x1a2f35, accent: 0xc88812, trim: 0x78350f, name: "Affari Regolatori", motif: "office" },
  power: { floor: 0xcdd5d6, wall: 0x1f3035, accent: 0xf59e0b, trim: 0xef4444, name: "Centralina", motif: "power" },
  water: { floor: 0xbfe0e8, wall: 0x164c58, accent: 0x06b6d4, trim: 0x38bdf8, name: "Acque", motif: "water" },
};

interface StaffAgent {
  id: string;
  role: Role;
  roomId: string;
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  head: THREE.Mesh;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  homePos: THREE.Vector3;
  patrolPoints: THREE.Vector3[];
  state: "working" | "walking";
  stateTimer: number;
  walkCycle: number;
  seed: number;
}

interface AnimatedSpinner {
  mesh: THREE.Object3D;
  speed: number;
}

interface AnimatedEmissive {
  mat: THREE.MeshStandardMaterial;
  baseColor: number;
  speed: number;
}

export class ThreeCampus {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private animFrameId: number | null = null;
  private options: ThreeCampusOptions;
  private lastTime = performance.now();
  private startTime = performance.now();

  // Camera & 4-Quadrant 360 Rotation
  private camTarget = new THREE.Vector3(0, 0, 0);
  private camOffset = new THREE.Vector3(26, 32, 26);
  private camAngleIndex = 0; // 0=NW, 1=NE, 2=SE, 3=SW
  private currentZoom = 26;

  // Interaction & Touch Pinch
  private isDragging = false;
  private prevPointer = { x: 0, y: 0 };
  private pointerDownPos = { x: 0, y: 0 };
  private activePointers = new Map<number, { x: number; y: number }>();
  private prevPinchDist = 0;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Scene object groups
  private groundGroup = new THREE.Group();
  private buildingsGroup = new THREE.Group();
  private corridorsGroup = new THREE.Group();
  private propsGroup = new THREE.Group();
  private staffGroup = new THREE.Group();
  private effectsGroup = new THREE.Group();
  private phantomGroup = new THREE.Group();

  // Gameplay Modes
  private movingRoomId: string | null = null;
  private bulldozerMode = false;
  private overlayMode: "normal" | "power" | "quality" | "staff" = "normal";

  // Dynamic animations & staff agents
  private staffAgents: StaffAgent[] = [];
  private animatedSpinners: AnimatedSpinner[] = [];
  private animatedEmissives: AnimatedEmissive[] = [];

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
    this.scene.add(this.phantomGroup);

    // 6. Listeners (with touch pinch support)
    this.setupEventListeners();

    // 7. Start Render Loop
    this.renderLoop = this.renderLoop.bind(this);
    this.renderLoop();
  }

  private setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xd9f3ea, 0xb0cbbd, 0.85);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(35, 55, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    const d = 42;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0003;
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x7ecbb5, 0.45);
    rimLight.position.set(-25, 20, -35);
    this.scene.add(rimLight);
  }

  private updateCameraPosition() {
    this.camera.position.copy(this.camTarget).add(this.camOffset);
    this.camera.lookAt(this.camTarget);
  }

  public setZoom(factor: number) {
    this.currentZoom = Math.max(14, Math.min(65, this.currentZoom * factor));
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

  public setOptions(options: Partial<ThreeCampusOptions>) {
    this.options = { ...this.options, ...options };
  }

  public rotateView(direction: 1 | -1) {
    this.camAngleIndex = (this.camAngleIndex + direction + 4) % 4;
    const angles = [
      { x: 26, z: 26 },
      { x: -26, z: 26 },
      { x: -26, z: -26 },
      { x: 26, z: -26 },
    ];
    this.camOffset.x = angles[this.camAngleIndex]!.x;
    this.camOffset.z = angles[this.camAngleIndex]!.z;
    this.updateCameraPosition();
  }

  public setMovingRoom(roomId: string | null) {
    this.movingRoomId = roomId;
    if (!roomId) {
      this.clearGroup(this.phantomGroup);
    }
  }

  public setBulldozerMode(enabled: boolean) {
    this.bulldozerMode = enabled;
    if (!enabled) {
      this.clearGroup(this.phantomGroup);
    }
  }

  public setOverlayMode(mode: "normal" | "power" | "quality" | "staff") {
    this.overlayMode = mode;
    this.rebuildScene();
  }

  public resetView() {
    if (!this.currentGame) return;
    this.centerOnCampus(this.currentGame);
  }

  private centerOnCampus(game: Game) {
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
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activePointers.size === 1) {
        this.isDragging = true;
        this.prevPointer = { x: e.clientX, y: e.clientY };
        this.pointerDownPos = { x: e.clientX, y: e.clientY };
      } else if (this.activePointers.size === 2) {
        // Pinch-to-zoom init
        this.isDragging = false;
        const pts = Array.from(this.activePointers.values());
        this.prevPinchDist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (this.activePointers.has(e.pointerId)) {
        this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Handle touch 2-finger pinch to zoom
      if (this.activePointers.size >= 2) {
        const pts = Array.from(this.activePointers.values());
        const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        if (this.prevPinchDist > 0 && Math.abs(dist - this.prevPinchDist) > 1.5) {
          const factor = this.prevPinchDist / dist;
          this.setZoom(factor);
          this.prevPinchDist = dist;
        }
        return;
      }

      // Handle room movement preview
      if (this.movingRoomId && this.currentGame) {
        this.updatePhantomRoomPreview(e);
      }

      if (!this.isDragging) return;

      const dx = e.clientX - this.prevPointer.x;
      const dy = e.clientY - this.prevPointer.y;
      this.prevPointer = { x: e.clientX, y: e.clientY };

      const factor = (this.currentZoom / this.container.clientHeight) * 1.35;
      let moveX = 0;
      let moveZ = 0;

      // Quadrant-aware panning
      if (this.camAngleIndex === 0) {
        moveX = (-dx + dy) * 0.7071 * factor;
        moveZ = (-dx - dy) * 0.7071 * factor;
      } else if (this.camAngleIndex === 1) {
        moveX = (-dx - dy) * 0.7071 * factor;
        moveZ = (dx - dy) * 0.7071 * factor;
      } else if (this.camAngleIndex === 2) {
        moveX = (dx - dy) * 0.7071 * factor;
        moveZ = (dx + dy) * 0.7071 * factor;
      } else {
        moveX = (dx + dy) * 0.7071 * factor;
        moveZ = (-dx + dy) * 0.7071 * factor;
      }

      this.camTarget.x += moveX;
      this.camTarget.z += moveZ;
      this.updateCameraPosition();
    });

    const onPointerEnd = (e: PointerEvent) => {
      this.activePointers.delete(e.pointerId);
      if (this.activePointers.size < 2) {
        this.prevPinchDist = 0;
      }
      if (!this.isDragging) return;
      this.isDragging = false;
      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (dist < 6) {
        this.handleClick(e);
      }
    };

    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);

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

  private updatePhantomRoomPreview(e: MouseEvent) {
    if (!this.movingRoomId || !this.currentGame) return;
    const game = this.currentGame;
    const room = game.rooms.find((r) => r.id === this.movingRoomId);
    if (!room) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.groundGroup.children, true);

    if (intersects.length > 0) {
      let topHit: THREE.Object3D | null = intersects[0]!.object;
      while (topHit && !topHit.userData.type && topHit.parent) {
        topHit = topHit.parent;
      }
      if (topHit?.userData?.type === "tile") {
        const c = topHit.userData.c;
        const r = topHit.userData.r;
        const err = canMoveRoom(game, this.movingRoomId, c, r);

        this.clearGroup(this.phantomGroup);

        const roomW = room.w * TILE_SIZE;
        const roomD = room.h * TILE_SIZE;
        const posX = (c + room.w / 2 - COLS / 2) * TILE_SIZE;
        const posZ = (r + room.h / 2 - ROWS / 2) * TILE_SIZE;

        const phantomGeo = new THREE.BoxGeometry(roomW * 0.98, 0.8, roomD * 0.98);
        const phantomMat = new THREE.MeshBasicMaterial({
          color: err ? 0xef4444 : 0x10b981,
          transparent: true,
          opacity: 0.55,
          wireframe: false,
        });

        const phantom = new THREE.Mesh(phantomGeo, phantomMat);
        phantom.position.set(posX, 0.45, posZ);
        this.phantomGroup.add(phantom);

        const wire = new THREE.BoxHelper(phantom, err ? 0xff0000 : 0x00ff88);
        this.phantomGroup.add(wire);
      }
    }
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

      // Handle Moving Room Drop
      if (this.movingRoomId && this.currentGame) {
        if (data.type === "tile") {
          const err = canMoveRoom(this.currentGame, this.movingRoomId, data.c, data.r);
          if (!err) {
            this.options.onMoveRoom?.(this.movingRoomId, { c: data.c, r: data.r });
            this.setMovingRoom(null);
            return;
          }
        }
      }

      // Handle Bulldozer Mode
      if (this.bulldozerMode) {
        if (data.type === "tile") {
          this.options.onDemolishTile?.({ c: data.c, r: data.r });
          return;
        } else if (data.type === "room") {
          const room = this.currentGame?.rooms.find((r) => r.id === data.roomId);
          if (room) {
            this.options.onDemolishTile?.({ c: room.c, r: room.r });
            return;
          }
        }
      }

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
    this.animatedSpinners = [];
    this.animatedEmissives = [];
    this.staffAgents = [];

    this.clearGroup(this.groundGroup);
    this.clearGroup(this.corridorsGroup);
    this.clearGroup(this.buildingsGroup);
    this.clearGroup(this.propsGroup);
    this.clearGroup(this.staffGroup);
    this.clearGroup(this.effectsGroup);

    this.buildTerrain(game);
    this.buildCorridors(game);
    this.buildRooms(game);
  }

  // ------------------------------------------
  // TERRAIN & PARCELS
  // ------------------------------------------
  private buildTerrain(game: Game) {
    const slabGeo = new THREE.BoxGeometry(TILE_SIZE * 0.96, 0.25, TILE_SIZE * 0.96);

    const matOwnedLot = new THREE.MeshStandardMaterial({ color: 0xbedcd0, roughness: 0.6, metalness: 0.05 });
    const matGarden = new THREE.MeshStandardMaterial({ color: 0x5a9a7a, roughness: 0.8, metalness: 0.02 });
    const matUnowned = new THREE.MeshStandardMaterial({ color: 0xc8d4ce, roughness: 0.85, metalness: 0.05 });
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
        slab.userData = { type: "tile", c, r };
        this.groundGroup.add(slab);
        this.interactiveMeshes.push(slab);

        // Stylized 3D trees on garden tiles
        if (tile.ground === "garden" && !tile.roomId && !tile.corridor) {
          this.createTree(posX, 0, posZ);
        }
      }
    }

    // Unowned parcel billboards
    for (const p of PARCELS) {
      if (game.owned.includes(p.id)) continue;

      const centerX = ((p.c0 + p.c1) / 2 - COLS / 2) * TILE_SIZE;
      const centerZ = ((p.r0 + p.r1) / 2 - ROWS / 2) * TILE_SIZE;

      const signPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 })
      );
      signPost.position.set(centerX, 0.8, centerZ);
      signPost.castShadow = true;
      signPost.userData = { type: "parcel", parcelId: p.id };
      this.groundGroup.add(signPost);
      this.interactiveMeshes.push(signPost);

      const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.9, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
      );
      signBoard.position.set(centerX, 1.45, centerZ);
      signBoard.castShadow = true;
      signBoard.userData = { type: "parcel", parcelId: p.id };
      this.groundGroup.add(signBoard);
      this.interactiveMeshes.push(signBoard);
    }
  }

  private createTree(x: number, y: number, z: number) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.9, 6),
      new THREE.MeshStandardMaterial({ color: 0x6e4a28, roughness: 0.9 })
    );
    trunk.position.y = 0.45;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const sphere1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 })
    );
    sphere1.position.y = 1.15;
    sphere1.castShadow = true;
    treeGroup.add(sphere1);

    const sphere2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 })
    );
    sphere2.position.y = 1.6;
    sphere2.castShadow = true;
    treeGroup.add(sphere2);

    this.groundGroup.add(treeGroup);
  }

  // ------------------------------------------
  // CORRIDORS & LOGISTICS CONDUITS
  // ------------------------------------------
  private buildCorridors(game: Game) {
    const corridorMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe1, roughness: 0.3, metalness: 0.1 });
    const conduitGlowMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = game.tiles[r]?.[c];
        if (!tile || !tile.corridor || tile.roomId) continue;

        const posX = (c - COLS / 2 + 0.5) * TILE_SIZE;
        const posZ = (r - ROWS / 2 + 0.5) * TILE_SIZE;

        const walkFloor = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE * 0.9, 0.14, TILE_SIZE * 0.9), corridorMat);
        walkFloor.position.set(posX, 0.07, posZ);
        walkFloor.receiveShadow = true;
        this.corridorsGroup.add(walkFloor);

        const conduit = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE * 0.22, 0.16, TILE_SIZE * 0.9), conduitGlowMat);
        conduit.position.set(posX, 0.08, posZ);
        this.corridorsGroup.add(conduit);
      }
    }
  }

  // ------------------------------------------
  // CLEANROOM BUILDINGS & DETAILED CUTAWAYS
  // ------------------------------------------
  private buildRooms(game: Game) {
    const power = powerReport(game);
    for (const room of game.rooms) {
      this.buildSingleRoom(game, room, power.off);
    }

    // Render unassigned staff strolling along corridors & campus
    const unassignedStaff = game.staff.filter((s) => !s.roomId);
    const corridorTiles: { c: number; r: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (game.tiles[r]?.[c]?.corridor) corridorTiles.push({ c, r });
      }
    }
    if (corridorTiles.length === 0) corridorTiles.push({ c: 3, r: 1 }, { c: 3, r: 2 });

    unassignedStaff.forEach((staffMember, index) => {
      const tile = corridorTiles[index % corridorTiles.length]!;
      const hX = (tile.c - COLS / 2 + 0.5) * TILE_SIZE;
      const hZ = (tile.r - ROWS / 2 + 0.5) * TILE_SIZE;

      const patrolPoints = corridorTiles.map(
        (t) => new THREE.Vector3((t.c - COLS / 2 + 0.5) * TILE_SIZE, 0.16, (t.r - ROWS / 2 + 0.5) * TILE_SIZE)
      );

      this.createAnimatedStaffAgent(
        staffMember.id,
        staffMember.role,
        "corridor",
        this.staffGroup,
        hX,
        0.16,
        hZ,
        patrolPoints
      );
    });
  }

  private buildSingleRoom(game: Game, room: Room, unpoweredList: { roomId: string; index: number }[]) {
    const theme = ROOM_THEMES[room.type] || ROOM_THEMES.pilot;
    const online = roomOnline(game, room);
    const isSelected = this.selectedRoomId === room.id;

    const roomW = room.w * TILE_SIZE;
    const roomD = room.h * TILE_SIZE;
    const posX = (room.c + room.w / 2 - COLS / 2) * TILE_SIZE;
    const posZ = (room.r + room.h / 2 - ROWS / 2) * TILE_SIZE;

    const roomRoot = new THREE.Group();
    roomRoot.position.set(posX, 0, posZ);
    roomRoot.userData = { type: "room", roomId: room.id };

    // 1. FLOOR COLOR BASED ON OVERLAY MODE
    let floorColor = online ? theme.floor : 0x8a9e97;
    let emissiveColor = 0x000000;
    let emissiveInt = 0;

    if (this.overlayMode === "power") {
      const isUnpowered = unpoweredList.some((p) => p.roomId === room.id) || !online;
      floorColor = isUnpowered ? 0xef4444 : 0x06b6d4;
      emissiveColor = isUnpowered ? 0xef4444 : 0x06b6d4;
      emissiveInt = 0.35;
    } else if (this.overlayMode === "quality") {
      floorColor = room.type === "sterile" || room.type === "plant" ? 0x10b981 : 0xf59e0b;
      emissiveColor = floorColor;
      emissiveInt = 0.25;
    } else if (this.overlayMode === "staff") {
      const crew = game.staff.filter((s) => s.roomId === room.id);
      const def = roomDef(room.type);
      floorColor = def.role && crew.length === 0 ? 0xf59e0b : 0x10b981;
      emissiveColor = floorColor;
      emissiveInt = 0.3;
    }

    const floorGeo = new THREE.BoxGeometry(roomW * 0.98, 0.16, roomD * 0.98);
    const floorMat = new THREE.MeshStandardMaterial({
      color: floorColor,
      emissive: emissiveColor,
      emissiveIntensity: emissiveInt,
      roughness: 0.16,
      metalness: 0.14,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = 0.08;
    floorMesh.receiveShadow = true;
    floorMesh.userData = { type: "room", roomId: room.id };
    roomRoot.add(floorMesh);
    this.interactiveMeshes.push(floorMesh);

    // Hazard perimeter floor markings
    if (theme.motif === "hazard" || theme.motif === "dock") {
      const hazardTape = new THREE.Mesh(
        new THREE.BoxGeometry(roomW * 0.99, 0.17, roomD * 0.99),
        new THREE.MeshStandardMaterial({ color: theme.trim, roughness: 0.4 })
      );
      hazardTape.position.y = 0.075;
      roomRoot.add(hazardTape);
    }

    // 2. ARCHITECTURAL CUTAWAY WALLS & ROOM LEVELS (1 -> 2 -> 3)
    const wallHeight = 1.3 + (room.level - 1) * 0.4;
    const wallThick = 0.16;

    const wallMat = new THREE.MeshStandardMaterial({
      color: online ? theme.wall : 0x3d4e48,
      roughness: 0.35,
      metalness: 0.3,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.85,
      opacity: 1,
      transparent: true,
      roughness: 0.08,
      ior: 1.45,
    });

    // Rear wall (North, Z-)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(roomW, wallHeight, wallThick), wallMat);
    northWall.position.set(0, wallHeight / 2 + 0.16, -roomD / 2 + wallThick / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    roomRoot.add(northWall);

    // Rear side wall (West, X-)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, roomD), wallMat);
    westWall.position.set(-roomW / 2 + wallThick / 2, wallHeight / 2 + 0.16, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    roomRoot.add(westWall);

    // Front Low Baseboards
    const curbHeight = 0.28;
    const southCurb = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.72, curbHeight, wallThick), wallMat);
    southCurb.position.set(-roomW * 0.12, curbHeight / 2 + 0.16, roomD / 2 - wallThick / 2);
    roomRoot.add(southCurb);

    const eastCurb = new THREE.Mesh(new THREE.BoxGeometry(wallThick, curbHeight, roomD * 0.72), wallMat);
    eastCurb.position.set(roomW / 2 - wallThick / 2, curbHeight / 2 + 0.16, -roomD * 0.12);
    roomRoot.add(eastCurb);

    // LEVEL 2 UPGRADES
    if (room.level >= 2) {
      const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.6, wallHeight * 0.45, 0.06), glassMat);
      windowMesh.position.set(0, wallHeight * 0.6 + 0.16, -roomD / 2 + wallThick + 0.02);
      roomRoot.add(windowMesh);

      const bumperMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
      const bumperRail = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.9, 0.08, 0.06), bumperMat);
      bumperRail.position.set(0, 0.45, -roomD / 2 + wallThick + 0.04);
      roomRoot.add(bumperRail);

      const hepaUnit = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.12, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
      );
      hepaUnit.position.set(0, wallHeight + 0.1, 0);
      roomRoot.add(hepaUnit);
    }

    // LEVEL 3 UPGRADES
    if (room.level >= 3) {
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 });

      const catwalk = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.85, 0.08, 0.45), steelMat);
      catwalk.position.set(0, wallHeight - 0.05, -roomD / 2 + 0.45);
      roomRoot.add(catwalk);

      const railing = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.85, 0.35, 0.04), steelMat);
      railing.position.set(0, wallHeight + 0.15, -roomD / 2 + 0.65);
      roomRoot.add(railing);

      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.24, wallHeight, 0.04), steelMat);
      ladder.position.set(-roomW / 2 + 0.35, wallHeight / 2 + 0.16, -roomD / 2 + 0.25);
      roomRoot.add(ladder);

      const statusScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.85, 0.28),
        new THREE.MeshBasicMaterial({ color: online ? 0x10b981 : 0xef4444 })
      );
      statusScreen.position.set(0, wallHeight * 0.85 + 0.16, -roomD / 2 + wallThick + 0.02);
      roomRoot.add(statusScreen);
    }

    // 3. ALL 56 EQUIPMENT IN SLOTS
    const anchors = anchorTiles(room);
    room.slots.forEach((slot, index) => {
      const tilePos = anchors[index];
      if (!tilePos) return;

      const slotWorldX = (tilePos.c + 0.5 - COLS / 2) * TILE_SIZE - posX;
      const slotWorldZ = (tilePos.r + 0.5 - ROWS / 2) * TILE_SIZE - posZ;

      if (!slot.item) {
        this.createEmptySlotMarker(roomRoot, slotWorldX, 0.18, slotWorldZ);
      } else {
        const isGearOff = !online || room.halt > 0 || unpoweredList.some((h) => h.roomId === room.id && h.index === index);
        this.createDedicated3DProp(
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

    // 4. ANIMATED STAFF AGENTS
    const crew = game.staff.filter((s) => s.roomId === room.id);
    crew.forEach((staffMember, index) => {
      const anchor = anchors[index % anchors.length];
      const hX = anchor ? (anchor.c + 0.4 - COLS / 2) * TILE_SIZE - posX : (index - 0.5) * 0.8;
      const hZ = anchor ? (anchor.r + 0.4 - ROWS / 2) * TILE_SIZE - posZ : 0;

      const patrolPoints: THREE.Vector3[] = [new THREE.Vector3(hX, 0.16, hZ)];
      for (const a of anchors) {
        patrolPoints.push(
          new THREE.Vector3(
            (a.c + 0.35 - COLS / 2) * TILE_SIZE - posX,
            0.16,
            (a.r + 0.35 - ROWS / 2) * TILE_SIZE - posZ
          )
        );
      }
      patrolPoints.push(new THREE.Vector3(roomW * 0.35, 0.16, roomD * 0.35));

      this.createAnimatedStaffAgent(staffMember.id, staffMember.role, room.id, roomRoot, hX, 0.16, hZ, patrolPoints);
    });

    // 5. SELECTION HIGHLIGHT
    if (isSelected) {
      const box = new THREE.BoxHelper(floorMesh, 0xf59e0b);
      roomRoot.add(box);
    }

    this.buildingsGroup.add(roomRoot);
  }

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

  // ==========================================
  // DEDICATED PROCEDURAL 3D MODELS FOR ALL 56 GEAR
  // ==========================================
  private createDedicated3DProp(
    parent: THREE.Group,
    defId: string,
    matKey: MatKey | undefined,
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

    if (defId === "reattore") {
      const radius = 0.22 + level * 0.08;
      const height = 0.65 + level * 0.3;

      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), metalMat);
      body.position.y = height / 2 + 0.15;
      body.castShadow = true;
      group.add(body);

      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8), metalMat);
      motor.position.y = height + 0.25;
      group.add(motor);
      this.animatedSpinners.push({ mesh: motor, speed: 6 });

      const liquidColor = 0xf59e0b;
      const glassGauge = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, height * 0.6, 8),
        new THREE.MeshStandardMaterial({
          color: isOnline ? liquidColor : 0x64748b,
          emissive: isOnline ? liquidColor : 0x000000,
          emissiveIntensity: isOnline ? 0.65 : 0,
          roughness: 0.1,
        })
      );
      glassGauge.position.set(radius * 0.9, height * 0.5 + 0.15, 0);
      group.add(glassGauge);
      if (isOnline) {
        this.animatedEmissives.push({ mat: glassGauge.material as THREE.MeshStandardMaterial, baseColor: liquidColor, speed: 4 });
      }

      if (level >= 2) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, height * 1.1, 8), metalMat);
        col.position.set(-radius * 1.05, height * 0.55 + 0.15, 0);
        group.add(col);
      }
      if (level >= 3) {
        const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.12, height + 0.3, 0.04), metalMat);
        ladder.position.set(0, (height + 0.3) / 2, radius * 1.02);
        group.add(ladder);
      }
    } else if (defId === "reattore-gmp") {
      const radius = 0.38 + level * 0.08;
      const height = 1.0 + level * 0.35;

      const vessel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 20), metalMat);
      vessel.position.y = height / 2 + 0.25;
      vessel.castShadow = true;
      group.add(vessel);

      const dish = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), metalMat);
      dish.position.y = 0.25;
      group.add(dish);

      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI * 2) / 4;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8), metalMat);
        leg.position.set(Math.cos(ang) * (radius * 0.88), 0.22, Math.sin(ang) * (radius * 0.88));
        group.add(leg);
      }

      if (level >= 2) {
        const platform = new THREE.Mesh(new THREE.BoxGeometry(radius * 2.8, 0.08, radius * 2.2), metalMat);
        platform.position.y = height * 0.75 + 0.25;
        group.add(platform);
      }
    } else if (defId === "bioreattore") {
      const radius = 0.3 + level * 0.07;
      const height = 0.85 + level * 0.25;

      const vessel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), metalMat);
      vessel.position.y = height / 2 + 0.2;
      group.add(vessel);

      const liquidColor = 0x06b6d4;
      const gauge = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, height * 0.7, 8),
        new THREE.MeshStandardMaterial({
          color: isOnline ? liquidColor : 0x475569,
          emissive: isOnline ? liquidColor : 0x000000,
          emissiveIntensity: isOnline ? 0.8 : 0,
        })
      );
      gauge.position.set(radius * 0.9, height * 0.5 + 0.2, 0);
      group.add(gauge);

      const manifold = new THREE.Mesh(new THREE.BoxGeometry(0.18, height * 0.8, 0.12), metalMat);
      manifold.position.set(-radius * 0.95, height * 0.5 + 0.2, 0);
      group.add(manifold);
    } else if (["hplc", "lcms", "sintetizzatore", "saggi", "micro"].includes(defId)) {
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.88 + level * 0.12, 0.52),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
      );
      tower.position.y = (0.88 + level * 0.12) / 2;
      tower.castShadow = true;
      group.add(tower);

      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.36, 0.24),
        new THREE.MeshBasicMaterial({ color: isOnline ? 0x0284c7 : 0x1e293b })
      );
      screen.position.set(0, 0.58, 0.27);
      group.add(screen);

      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.02),
        new THREE.MeshBasicMaterial({ color: isOnline ? 0x10b981 : 0xef4444 })
      );
      led.position.set(0.2, 0.76, 0.27);
      group.add(led);

      if (defId === "hplc" || defId === "lcms") {
        for (let i = 0; i < 3; i++) {
          const bottle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.16, 8),
            new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transmission: 0.8, transparent: true })
          );
          bottle.position.set(-0.16 + i * 0.16, 0.96 + level * 0.12, 0);
          group.add(bottle);
        }
      }
    } else if (["cappa", "isolatore", "vestizione"].includes(defId)) {
      const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 1.15, 0.58),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.3 })
      );
      cabinet.position.y = 0.575;
      cabinet.castShadow = true;
      group.add(cabinet);

      const sash = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 0.56),
        new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transmission: 0.88, transparent: true, roughness: 0.05 })
      );
      sash.position.set(0, 0.52, 0.3);
      group.add(sash);

      if (defId === "isolatore") {
        for (let i = 0; i < 2; i++) {
          const port = new THREE.Mesh(
            new THREE.RingGeometry(0.05, 0.08, 12),
            new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide })
          );
          port.position.set(-0.16 + i * 0.32, 0.42, 0.305);
          group.add(port);
        }
      }
    } else if (defId === "scaffale" || defId === "imp" || defId === "armadietti") {
      const rackHeight = 0.65 + level * 0.35;
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.92, rackHeight, 0.46), frameMat);
      rack.position.y = rackHeight / 2;
      rack.castShadow = true;
      group.add(rack);

      const bottleColor = matKey === "solvent" ? 0x1e40af : matKey === "eccipient" ? 0xf8fafc : 0xb45309;
      const count = level * 2;
      for (let i = 0; i < count; i++) {
        const drum = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.22, 8),
          new THREE.MeshStandardMaterial({ color: bottleColor, roughness: 0.3 })
        );
        drum.position.set(-0.25 + (i % 2) * 0.5, 0.2 + Math.floor(i / 2) * 0.32, 0.15);
        group.add(drum);
      }
    } else if (["blister", "astuccio", "riempimento", "fill-sterile", "serial", "baia"].includes(defId)) {
      const table = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, 0.36, 0.46),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.7, roughness: 0.3 })
      );
      table.position.y = 0.25;
      table.castShadow = true;
      group.add(table);

      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(-0.2, 0.55, 0);
      group.add(wheel);
      this.animatedSpinners.push({ mesh: wheel, speed: 4 });

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), metalMat);
      arm.position.set(0.2, 0.58, 0);
      group.add(arm);
    } else if (defId === "trasformatore" || defId === "generatore") {
      const transformer = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.85 + level * 0.15, 0.65),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 })
      );
      transformer.position.y = (0.85 + level * 0.15) / 2;
      transformer.castShadow = true;
      group.add(transformer);

      const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.2 });
      for (let i = 0; i < 3; i++) {
        const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.28, 8), coilMat);
        coil.position.set(-0.22 + i * 0.22, 0.95 + level * 0.15, 0);
        group.add(coil);
      }
    } else if (defId === "pw" || defId === "wfi") {
      const still = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.25, 16), metalMat);
      still.position.y = 0.65;
      still.castShadow = true;
      group.add(still);

      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
      const pipe = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 8, 16), pipeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(0, 0.7, 0);
      group.add(pipe);
    } else if (["freezer", "freezer-campioni", "climatica"].includes(defId)) {
      const fridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 1.15, 0.58),
        new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.2, metalness: 0.4 })
      );
      fridge.position.y = 0.575;
      fridge.castShadow = true;
      group.add(fridge);

      const led = new THREE.Mesh(
        new THREE.PlaneGeometry(0.24, 0.12),
        new THREE.MeshBasicMaterial({ color: isOnline ? 0x0284c7 : 0x64748b })
      );
      led.position.set(0, 0.9, 0.3);
      group.add(led);
    } else if (["filtro", "filtro-pilota", "cip"].includes(defId)) {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.65), metalMat);
      skid.position.y = 0.225;
      group.add(skid);

      for (let i = 0; i < 2; i++) {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.6, 12), metalMat);
        tank.position.set(-0.2 + i * 0.4, 0.65, 0);
        group.add(tank);
      }
    } else if (["letti", "monitor-1", "monitor-2", "pharmacy", "unitdose"].includes(defId)) {
      if (defId === "letti") {
        const bed = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 0.32, 1.1),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 })
        );
        bed.position.y = 0.2;
        bed.castShadow = true;
        group.add(bed);

        const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), metalMat);
        ivPole.position.set(0.38, 0.55, -0.4);
        group.add(ivPole);
      } else {
        const cart = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.45), metalMat);
        cart.position.y = 0.375;
        group.add(cart);

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.22), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        screen.position.set(0, 0.6, 0.23);
        group.add(screen);
      }
    } else if (defId === "transpallet") {
      const palletJack = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.35, 0.85),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
      );
      palletJack.position.y = 0.2;
      group.add(palletJack);
    } else if (defId === "gabbia") {
      const cage = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 1.1, 0.85),
        new THREE.MeshStandardMaterial({ color: 0xd97706, wireframe: true })
      );
      cage.position.y = 0.55;
      group.add(cage);
    } else {
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(0.74, 0.42, 0.48),
        new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.4 })
      );
      desk.position.y = 0.25;
      desk.castShadow = true;
      group.add(desk);

      const mon = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.04), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
      mon.position.set(0, 0.58, -0.1);
      group.add(mon);
    }

    parent.add(group);
  }

  // ==========================================
  // ANIMATED 3D STAFF SYSTEM
  // ==========================================
  private createAnimatedStaffAgent(
    id: string,
    role: Role,
    roomId: string,
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    patrolPoints: THREE.Vector3[]
  ) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    let suitColor = 0xffffff;
    if (role === "operator") suitColor = 0x0284c7;
    else if (role === "scientist") suitColor = 0x10b981;
    else if (role === "qa") suitColor = 0xf59e0b;
    else if (role === "clinical") suitColor = 0x6366f1;
    else if (role === "regulatory") suitColor = 0x475569;
    else if (role === "commercial") suitColor = 0x0f766e;

    const suitMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.5 });
    const limbMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.5 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.42, 8), suitMat);
    body.position.y = 0.38;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), headMat);
    head.position.y = 0.68;
    head.castShadow = true;
    group.add(head);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 6), limbMat);
    leftLeg.position.set(-0.06, 0.14, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 6), limbMat);
    rightLeg.position.set(0.06, 0.14, 0);
    group.add(rightLeg);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6), limbMat);
    leftArm.position.set(-0.16, 0.4, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6), limbMat);
    rightArm.position.set(0.16, 0.4, 0);
    group.add(rightArm);

    parent.add(group);

    const agent: StaffAgent = {
      id,
      role,
      roomId,
      group,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      head,
      currentPos: new THREE.Vector3(x, y, z),
      targetPos: new THREE.Vector3(x, y, z),
      homePos: new THREE.Vector3(x, y, z),
      patrolPoints,
      state: "working",
      stateTimer: 2 + Math.random() * 4,
      walkCycle: Math.random() * Math.PI * 2,
      seed: Math.random() * 10,
    };

    this.staffAgents.push(agent);
  }

  // ------------------------------------------
  // RENDER LOOP & REAL-TIME ANIMATIONS
  // ------------------------------------------
  private updateAnimations(delta: number, time: number) {
    for (const item of this.animatedSpinners) {
      item.mesh.rotation.y += item.speed * delta;
    }

    for (const em of this.animatedEmissives) {
      em.mat.emissiveIntensity = 0.5 + Math.sin(time * em.speed) * 0.35;
    }

    for (const agent of this.staffAgents) {
      agent.stateTimer -= delta;

      if (agent.state === "working") {
        agent.group.position.y = agent.currentPos.y + Math.sin(time * 3 + agent.seed) * 0.015;
        agent.rightArm.rotation.x = Math.sin(time * 4 + agent.seed) * 0.3 - 0.2;
        agent.leftArm.rotation.x = Math.cos(time * 3 + agent.seed) * 0.15;
        agent.leftLeg.rotation.x = 0;
        agent.rightLeg.rotation.x = 0;

        if (agent.stateTimer <= 0) {
          const nextTarget = agent.patrolPoints[Math.floor(Math.random() * agent.patrolPoints.length)] || agent.homePos;
          agent.targetPos.copy(nextTarget);
          agent.state = "walking";
          agent.stateTimer = 4 + Math.random() * 4;
        }
      } else if (agent.state === "walking") {
        const toTarget = agent.targetPos.clone().sub(agent.currentPos);
        const dist = toTarget.length();

        if (dist < 0.08 || agent.stateTimer <= 0) {
          agent.currentPos.copy(agent.targetPos);
          agent.group.position.copy(agent.currentPos);
          agent.state = "working";
          agent.stateTimer = 3 + Math.random() * 6;
          agent.leftLeg.rotation.x = 0;
          agent.rightLeg.rotation.x = 0;
          agent.leftArm.rotation.x = 0;
          agent.rightArm.rotation.x = 0;
        } else {
          toTarget.normalize();
          const speed = 1.25;
          const step = Math.min(dist, speed * delta);
          agent.currentPos.addScaledVector(toTarget, step);
          agent.group.position.copy(agent.currentPos);

          agent.group.rotation.y = Math.atan2(toTarget.x, toTarget.z);

          agent.walkCycle += delta * 9;
          agent.leftLeg.rotation.x = Math.sin(agent.walkCycle) * 0.6;
          agent.rightLeg.rotation.x = -Math.sin(agent.walkCycle) * 0.6;
          agent.leftArm.rotation.x = -Math.sin(agent.walkCycle) * 0.5;
          agent.rightArm.rotation.x = Math.sin(agent.walkCycle) * 0.5;
          agent.group.position.y = agent.currentPos.y + Math.abs(Math.sin(agent.walkCycle)) * 0.035;
        }
      }
    }
  }

  private renderLoop() {
    this.animFrameId = requestAnimationFrame(this.renderLoop);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    const time = (now - this.startTime) / 1000;

    this.updateAnimations(delta, time);
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

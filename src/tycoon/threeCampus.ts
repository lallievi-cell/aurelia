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
    grade: string;
    motif: "hazard" | "sterile" | "dock" | "clinical" | "office" | "water" | "power";
  }
> = {
  hq: { floor: 0xf8fafc, wall: 0x1b7a64, accent: 0xc88812, trim: 0x8a5a34, name: "Direzione Generale", grade: "EXECUTIVE HQ", motif: "office" },
  gown: { floor: 0xf1f5f9, wall: 0x4a6b63, accent: 0x0284c7, trim: 0x38bdf8, name: "Spogliatoio Airlock", grade: "ISO 7 / CNC", motif: "sterile" },
  warehouse: { floor: 0xe2e8f0, wall: 0x6e4a28, accent: 0xd97706, trim: 0xf59e0b, name: "Magazzino GMP", grade: "MAG / CNC", motif: "dock" },
  quarantine: { floor: 0xfef08a, wall: 0x8a5818, accent: 0xb45309, trim: 0x1e293b, name: "Area Quarantena", grade: "QC HOLD", motif: "hazard" },
  cold: { floor: 0xdbeafe, wall: 0x366885, accent: 0x0284c7, trim: 0x60a5fa, name: "Cella Frigo 2-8°C", grade: "COLD CHAIN", motif: "sterile" },
  shipping: { floor: 0xe2e8f0, wall: 0x6b4f35, accent: 0x92400e, trim: 0xf59e0b, name: "Baia Spedizioni", grade: "DOCK / LOG", motif: "dock" },
  pilot: { floor: 0xfef3c7, wall: 0xb5780a, accent: 0xd97706, trim: 0xf59e0b, name: "Locale Pilota", grade: "GRADE D", motif: "hazard" },
  plant: { floor: 0xe0f2fe, wall: 0x143b42, accent: 0x0284c7, trim: 0xf59e0b, name: "Impianto GMP Bulk", grade: "GRADE C", motif: "hazard" },
  pack: { floor: 0xf1f5f9, wall: 0x7a4d29, accent: 0xb45309, trim: 0xc88812, name: "Confezionamento", grade: "GRADE D", motif: "dock" },
  sterile: { floor: 0xf8fafc, wall: 0x0d5c52, accent: 0x059669, trim: 0x10b981, name: "Suite Sterile Aseptic", grade: "GRADE A / B", motif: "sterile" },
  qc: { floor: 0xecfdf5, wall: 0x315c34, accent: 0x059669, trim: 0x34d399, name: "Laboratorio QC", grade: "GLP / ANALYTICAL", motif: "sterile" },
  stability: { floor: 0xf0fdf4, wall: 0x3d5c36, accent: 0x16a34a, trim: 0x4ade80, name: "Camere Stabilità ICH", grade: "ICH STABILITY", motif: "sterile" },
  discovery: { floor: 0xecfeff, wall: 0x10594b, accent: 0x0891b2, trim: 0x06b6d4, name: "Lab Drug Discovery", grade: "R&D DISCOVERY", motif: "sterile" },
  preclinical: { floor: 0xf0fdfa, wall: 0x0d4c40, accent: 0x0d9488, trim: 0x14b8a6, name: "Lab Preclinico GLP", grade: "PRECLINICAL", motif: "sterile" },
  phase1: { floor: 0xeff6ff, wall: 0x324763, accent: 0x2563eb, trim: 0x60a5fa, name: "Unità Clinica Fase I", grade: "GCP CLINICAL", motif: "clinical" },
  phase23: { floor: 0xeff6ff, wall: 0x223650, accent: 0x1d4ed8, trim: 0x3b82f6, name: "Unità Clinica Fase II/III", grade: "GCP ADVANCED", motif: "clinical" },
  regulatory: { floor: 0xfef9c3, wall: 0x1a2f35, accent: 0xca8a04, trim: 0x854d0e, name: "Uffici Direzione & Regolatorio", grade: "EXECUTIVE SUITE", motif: "office" },
  power: { floor: 0x334155, wall: 0x1f3035, accent: 0xf59e0b, trim: 0xef4444, name: "Centrale Elettrica & UPS", grade: "UTILITIES 400V", motif: "power" },
  water: { floor: 0xe0f2fe, wall: 0x164c58, accent: 0x0284c7, trim: 0x38bdf8, name: "Impianto Acqua PW / WFI", grade: "USP / EP WATER", motif: "water" },
};

interface StaffAgent {
  id: string;
  role: Role;
  roomId: string;
  group: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  head: THREE.Mesh;
  roleGem?: THREE.Mesh;
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

  // Interaction, Pixel-Perfect Ground Lock & Touch Pinch
  private isDragging = false;
  private pointerDownPos = { x: 0, y: 0 };
  private activePointers = new Map<number, { x: number; y: number }>();
  private lastGroundPos: THREE.Vector3 | null = null;
  private prevPinchDist = 0;
  private prevPinchMid: { x: number; y: number } | null = null;
  private panVelocity = { x: 0, z: 0 };
  private lastMoveTime = performance.now();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Scene object groups
  private environmentGroup = new THREE.Group();
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

  private environmentBuilt = false;
  private isContextLost = false;

  constructor(container: HTMLElement, options: ThreeCampusOptions) {
    this.container = container;
    this.options = options;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const aspect = width / height;

    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

    // 1. Scene with soft atmospheric haze and sky dome
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdceee7);
    this.scene.fog = new THREE.FogExp2(0xdceee7, 0.007);

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

    // 3. Renderer with antialiasing and shadow maps (optimized for mobile VRAM & GPU limits)
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: "default",
      precision: isMobile ? "mediump" : "highp",
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isMobile;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.container.appendChild(this.renderer.domElement);

    // Context loss handlers for mobile stability
    const dom = this.renderer.domElement;
    dom.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.isContextLost = true;
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    });
    dom.addEventListener("webglcontextrestored", () => {
      this.isContextLost = false;
      this.environmentBuilt = false;
      if (this.currentGame) {
        this.rebuildScene();
      }
      this.renderLoop();
    });

    // 4. Lighting
    this.setupLighting(isMobile);

    // 5. Add Groups to Scene (Environment first as background foundation)
    this.scene.add(this.environmentGroup);
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

  private setupLighting(isMobile = false) {
    // Rich natural sky hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x7c9b8f, 0.95);
    this.scene.add(hemiLight);

    // Golden sunlight with soft shadows
    const sunLight = new THREE.DirectionalLight(0xfff6e6, 1.6);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = !isMobile;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    const d = 55;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.radius = isMobile ? 1.0 : 2.0;
    this.scene.add(sunLight);

    // Cool ambient mint fill light from opposite angle
    const rimLight = new THREE.DirectionalLight(0x9bd8c8, 0.55);
    rimLight.position.set(-30, 24, -40);
    this.scene.add(rimLight);

    // Soft warm ground bounce
    const softBounce = new THREE.DirectionalLight(0xfef08a, 0.2);
    softBounce.position.set(0, -20, 0);
    this.scene.add(softBounce);
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

  private getGroundIntersection(screenX: number, screenY: number): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const ndcX = ((screenX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((screenY - rect.top) / rect.height) * 2 + 1;

    this.mouse.set(ndcX, ndcY);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const target = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, target);
  }

  private clampCameraTarget() {
    const maxBound = 45;
    this.camTarget.x = Math.max(-maxBound, Math.min(maxBound, this.camTarget.x));
    this.camTarget.z = Math.max(-maxBound, Math.min(maxBound, this.camTarget.z));
  }

  private setupEventListeners() {
    const el = this.renderer.domElement;
    el.style.touchAction = "none";
    el.style.userSelect = "none";

    el.addEventListener("pointerdown", (e) => {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}

      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.panVelocity = { x: 0, z: 0 }; // Instantly halt any fling inertia on touch

      if (this.activePointers.size === 1) {
        this.isDragging = true;
        this.pointerDownPos = { x: e.clientX, y: e.clientY };
        this.lastGroundPos = this.getGroundIntersection(e.clientX, e.clientY);
        this.lastMoveTime = performance.now();
      } else if (this.activePointers.size === 2) {
        // Pinch-to-zoom + pan init
        this.isDragging = false;
        const pts = Array.from(this.activePointers.values());
        this.prevPinchDist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        this.prevPinchMid = { x: (pts[0]!.x + pts[1]!.x) / 2, y: (pts[0]!.y + pts[1]!.y) / 2 };
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (this.activePointers.has(e.pointerId)) {
        this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // 1. Multi-touch: 2-finger smooth pinch-to-zoom and midpoint pan
      if (this.activePointers.size >= 2) {
        const pts = Array.from(this.activePointers.values());
        const currentDist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        const midX = (pts[0]!.x + pts[1]!.x) / 2;
        const midY = (pts[0]!.y + pts[1]!.y) / 2;

        if (this.prevPinchDist > 0 && currentDist > 5) {
          const ratio = this.prevPinchDist / currentDist;
          // Smooth zoom damping: avoid extreme jumps
          const factor = Math.max(0.92, Math.min(1.08, 1 + (ratio - 1) * 0.85));
          this.setZoom(factor);
          this.prevPinchDist = currentDist;
        }

        if (this.prevPinchMid) {
          const prevMidGround = this.getGroundIntersection(this.prevPinchMid.x, this.prevPinchMid.y);
          const currMidGround = this.getGroundIntersection(midX, midY);
          if (prevMidGround && currMidGround) {
            this.camTarget.x += prevMidGround.x - currMidGround.x;
            this.camTarget.z += prevMidGround.z - currMidGround.z;
            this.clampCameraTarget();
            this.updateCameraPosition();
          }
        }
        this.prevPinchMid = { x: midX, y: midY };
        return;
      }

      // 2. Room movement phantom preview
      if (this.movingRoomId && this.currentGame) {
        this.updatePhantomRoomPreview(e);
      }

      // 3. Single-finger / Mouse 1:1 Pixel-Perfect Ground-Locked Panning
      if (!this.isDragging) return;

      const now = performance.now();
      const dt = Math.max(0.001, (now - this.lastMoveTime) / 1000);
      this.lastMoveTime = now;

      const currentGround = this.getGroundIntersection(e.clientX, e.clientY);
      if (currentGround && this.lastGroundPos) {
        const deltaX = this.lastGroundPos.x - currentGround.x;
        const deltaZ = this.lastGroundPos.z - currentGround.z;

        this.camTarget.x += deltaX;
        this.camTarget.z += deltaZ;
        this.clampCameraTarget();
        this.updateCameraPosition();

        // Calculate velocity for smooth fling momentum
        const vx = deltaX / dt;
        const vz = deltaZ / dt;
        this.panVelocity = {
          x: this.panVelocity.x * 0.35 + vx * 0.65,
          z: this.panVelocity.z * 0.35 + vz * 0.65,
        };

        // Re-read ground position after moving camera so subsequent movement remains locked
        const newGround = this.getGroundIntersection(e.clientX, e.clientY);
        if (newGround) {
          this.lastGroundPos.copy(newGround);
        }
      } else if (currentGround) {
        this.lastGroundPos = currentGround.clone();
      }
    });

    const onPointerEnd = (e: PointerEvent) => {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}

      this.activePointers.delete(e.pointerId);

      if (this.activePointers.size === 1) {
        // Seamlessly continue 1-finger drag when lifting one finger from pinch
        const remaining = Array.from(this.activePointers.values())[0]!;
        this.lastGroundPos = this.getGroundIntersection(remaining.x, remaining.y);
        this.isDragging = true;
        this.lastMoveTime = performance.now();
        this.prevPinchDist = 0;
        this.prevPinchMid = null;
        return;
      }

      if (this.activePointers.size === 0) {
        this.prevPinchDist = 0;
        this.prevPinchMid = null;

        if (this.isDragging) {
          this.isDragging = false;
          const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
          // High-DPI touch devices have fingertip jitter; allow 16px tap threshold vs 7px on mouse
          const isTouch = e.pointerType === "touch";
          const tapThreshold = isTouch ? 16 : 7;

          if (dist < tapThreshold) {
            this.panVelocity = { x: 0, z: 0 };
            this.handleClick(e);
          } else {
            // Cap fling speed so map stays within comfortable viewing range
            const maxSpeed = 30;
            this.panVelocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, this.panVelocity.x));
            this.panVelocity.z = Math.max(-maxSpeed, Math.min(maxSpeed, this.panVelocity.z));
          }
        }
      }
    };

    el.addEventListener("pointerup", onPointerEnd);
    el.addEventListener("pointercancel", onPointerEnd);
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

  private disposeHierarchy(obj: THREE.Object3D) {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            for (const mat of mesh.material) {
              mat.dispose();
            }
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  }

  private clearGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const obj = group.children[0]!;
      group.remove(obj);
      this.disposeHierarchy(obj);
    }
  }

  private rebuildScene() {
    const game = this.currentGame;
    if (!game) return;

    this.interactiveMeshes = [];
    this.animatedSpinners = [];
    this.animatedEmissives = [];
    this.staffAgents = [];

    // The outdoor environment (roads, trees, parking, perimeter, chillers) is static
    // Building it once prevents generating hundreds of meshes every single second
    if (!this.environmentBuilt) {
      this.clearGroup(this.environmentGroup);
      this.buildEnvironment(game);
      this.environmentBuilt = true;
    }

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
  // 1. CAMPUS EXTERIOR ENVIRONMENT & UTILITIES
  // ------------------------------------------
  private buildEnvironment(game: Game) {
    const campusWidth = COLS * TILE_SIZE;
    const campusDepth = ROWS * TILE_SIZE;

    // 1. Vast Natural Landscape Terrain
    const grassGeo = new THREE.PlaneGeometry(180, 180);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x427552, // Rich organic park lawn
      roughness: 0.96,
      metalness: 0.02,
    });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.position.y = -0.32;
    grassMesh.receiveShadow = true;
    this.environmentGroup.add(grassMesh);

    // 2. Concrete Campus Podium Under the Grid (strictly lower than tile surface to prevent z-fighting)
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Clean industrial foundation concrete
      roughness: 0.8,
      metalness: 0.05,
    });
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(campusWidth + 3.2, 0.24, campusDepth + 3.2),
      plinthMat
    );
    plinth.position.set(0, -0.24, 0);
    plinth.receiveShadow = true;
    this.environmentGroup.add(plinth);

    // Perimeter curb stone around the foundation
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
    const curbNorth = new THREE.Mesh(new THREE.BoxGeometry(campusWidth + 3.4, 0.16, 0.4), curbMat);
    curbNorth.position.set(0, -0.12, -campusDepth / 2 - 1.4);
    this.environmentGroup.add(curbNorth);

    const curbWest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, campusDepth + 3.4), curbMat);
    curbWest.position.set(-campusWidth / 2 - 1.4, -0.12, 0);
    this.environmentGroup.add(curbWest);

    // 3. Perimeter Asphalt Two-Lane Roadway (South & East Borders)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x273038, roughness: 0.85 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // South Road
    const roadZ = campusDepth / 2 + 4.2;
    const roadWidth = 5.4;
    const roadLength = campusWidth + 24;
    const southRoad = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.12, roadWidth), roadMat);
    southRoad.position.set(0, -0.22, roadZ);
    southRoad.receiveShadow = true;
    this.environmentGroup.add(southRoad);

    const southDblLine = new THREE.Mesh(new THREE.BoxGeometry(roadLength - 2, 0.02, 0.16), yellowLineMat);
    southDblLine.position.set(0, -0.15, roadZ);
    this.environmentGroup.add(southDblLine);

    // East Road
    const roadX = campusWidth / 2 + 4.2;
    const eastRoad = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, 0.12, campusDepth + 24), roadMat);
    eastRoad.position.set(roadX, -0.22, 0);
    eastRoad.receiveShadow = true;
    this.environmentGroup.add(eastRoad);

    const eastDblLine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, campusDepth + 20), yellowLineMat);
    eastDblLine.position.set(roadX, -0.15, 0);
    this.environmentGroup.add(eastDblLine);

    // Painted Pedestrian Crosswalk (Zebra Stripes) leading into the campus gate
    for (let i = 0; i < 7; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 2.6), lineMat);
      stripe.position.set(-2.4 + i * 0.8, -0.15, roadZ);
      this.environmentGroup.add(stripe);
    }

    // 4. Security Entrance Gatehouse & Barrier
    this.buildGatehouse(-5.8, -0.16, roadZ - roadWidth / 2 - 1.2);

    // 5. Parking Lot with Delivery Van and Cars
    this.buildParkingLot(8.5, -0.22, roadZ - 2.8);

    // 6. External Industrial Utilities: Liquid Nitrogen Tanks, Electrical Substation, Chillers
    this.buildIndustrialUtilities(-campusWidth / 2 - 4.5, -0.22, -2);

    // 7. Perimeter Landscaping & Modern Lighting
    this.buildPerimeterLandscaping(campusWidth, campusDepth, roadZ, roadX);
  }

  private buildGatehouse(x: number, y: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Concrete island
    const island = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.22, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xc8d5cf, roughness: 0.6 })
    );
    island.position.y = 0.11;
    island.receiveShadow = true;
    group.add(island);

    // Booth building
    const boothMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const booth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.4), boothMat);
    booth.position.set(-0.6, 0.92, 0);
    booth.castShadow = true;
    group.add(booth);

    // Glass windows
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.55,
    });
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.6, 1.44), glassMat);
    windowMesh.position.set(-0.6, 1.05, 0);
    group.add(windowMesh);

    // Canopy roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.14, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
    );
    roof.position.set(-0.1, 1.7, 0);
    roof.castShadow = true;
    group.add(roof);

    // Boom barrier
    const barrierPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.85, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
    );
    barrierPost.position.set(0.9, 0.54, 0);
    group.add(barrierPost);

    const barrierArm = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.08, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
    );
    barrierArm.position.set(2.1, 0.85, 0);
    group.add(barrierArm);

    // Entrance Monument
    const monument = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.1, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x1b7a64, roughness: 0.35 })
    );
    monument.position.set(-2.8, 0.66, 0);
    monument.castShadow = true;
    group.add(monument);

    const goldPlaque = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.45, 0.38),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 })
    );
    goldPlaque.position.set(-2.8, 0.72, 0);
    group.add(goldPlaque);

    this.environmentGroup.add(group);
  }

  private buildParkingLot(x: number, y: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Asphalt surface
    const lotMesh = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 0.14, 5.2),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
    );
    lotMesh.position.y = 0.07;
    lotMesh.receiveShadow = true;
    group.add(lotMesh);

    // Parking bay stripes
    const paintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i <= 5; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 2.2), paintMat);
      line.position.set(-3.75 + i * 1.5, 0.15, -1.2);
      group.add(line);
    }

    // Pharma Delivery Box Van
    this.createCar(group, -3.0, 0.14, -1.2, 0x0284c7, true);
    // Passenger Cars
    this.createCar(group, -1.5, 0.14, -1.2, 0xe2e8f0, false);
    this.createCar(group, 0.0, 0.14, -1.2, 0x1e3a8a, false);
    this.createCar(group, 1.5, 0.14, -1.2, 0x991b1b, false);
    this.createCar(group, 3.0, 0.14, -1.2, 0x059669, false);

    this.environmentGroup.add(group);
  }

  private createCar(parent: THREE.Group, x: number, y: number, z: number, color: number, isVan: boolean) {
    const carGroup = new THREE.Group();
    carGroup.position.set(x, y, z);

    const carMat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    if (isVan) {
      // Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.0), carMat);
      cab.position.set(0, 0.65, 0.6);
      cab.castShadow = true;
      carGroup.add(cab);

      // Windshield
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.45, 0.4), glassMat);
      windshield.position.set(0, 0.8, 0.8);
      carGroup.add(windshield);

      // Cargo box
      const cargo = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.25, 1.5),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
      );
      cargo.position.set(0, 0.82, -0.45);
      cargo.castShadow = true;
      carGroup.add(cargo);

      // Cyan logo stripe
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(1.22, 0.2, 1.52),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3 })
      );
      stripe.position.set(0, 0.82, -0.45);
      carGroup.add(stripe);
    } else {
      // Passenger car body
      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 1.8), carMat);
      lowerBody.position.y = 0.4;
      lowerBody.castShadow = true;
      carGroup.add(lowerBody);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 1.0), glassMat);
      cabin.position.set(0, 0.76, -0.1);
      cabin.castShadow = true;
      carGroup.add(cabin);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.06, 0.95), carMat);
      roof.position.set(0, 0.98, -0.1);
      carGroup.add(roof);
    }

    // 4 Wheels
    for (const wx of [-0.52, 0.52]) {
      for (const wz of [-0.55, 0.55]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.2, wz);
        carGroup.add(wheel);
      }
    }

    parent.add(carGroup);
  }

  private buildIndustrialUtilities(x: number, y: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Concrete utility pad
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 0.24, 12.8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 })
    );
    pad.position.y = 0.12;
    pad.receiveShadow = true;
    group.add(pad);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });

    // 1. Two Large Liquid Nitrogen (LN2) Bulk Cryogenic Tanks
    for (let i = 0; i < 2; i++) {
      const tankZ = -3.2 + i * 3.2;
      const tankBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 3.4, 20),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.18, metalness: 0.3 })
      );
      tankBody.position.set(-1.2, 1.94, tankZ);
      tankBody.castShadow = true;
      group.add(tankBody);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.18, metalness: 0.3 })
      );
      dome.position.set(-1.2, 3.64, tankZ);
      group.add(dome);

      // Cage ladder
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 0.1), metalMat);
      ladder.position.set(-1.2, 1.94, tankZ + 0.95);
      group.add(ladder);

      // Cryo piping
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), pipeMat);
      pipe.position.set(-0.2, 1.34, tankZ);
      group.add(pipe);
    }

    // 2. High-Voltage Electrical Transformer Substation
    const transformerBox = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 })
    );
    transformerBox.position.set(1.4, 1.04, -2.4);
    transformerBox.castShadow = true;
    group.add(transformerBox);

    // Radiator cooling fins
    for (let f = 0; f < 5; f++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 1.8), metalMat);
      fin.position.set(0.3 + f * 0.12, 1.04, -2.4);
      group.add(fin);
    }

    // Ceramic insulators on top
    for (let c = 0; c < 3; c++) {
      const insulator = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4 })
      );
      insulator.position.set(1.0 + c * 0.4, 2.05, -2.4);
      group.add(insulator);
    }

    // 3. Commercial HVAC Rooftop/Ground Chillers with Dual Spinning Fans!
    for (let k = 0; k < 2; k++) {
      const chillerZ = 2.4 + k * 2.2;
      const chillerMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1.2, 1.8),
        new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.4 })
      );
      chillerMesh.position.set(1.3, 0.84, chillerZ);
      chillerMesh.castShadow = true;
      group.add(chillerMesh);

      // 2 Spinning Fan Blades on Top!
      for (const fx of [0.85, 1.75]) {
        const fanRing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
        );
        fanRing.position.set(fx, 1.48, chillerZ);
        group.add(fanRing);

        const fanBlade = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.02, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
        );
        fanBlade.position.set(fx, 1.5, chillerZ);
        group.add(fanBlade);
        this.animatedSpinners.push({ mesh: fanBlade, speed: 12 });
      }
    }

    this.environmentGroup.add(group);
  }

  private buildPerimeterLandscaping(campusW: number, campusD: number, roadZ: number, roadX: number) {
    const treePositions = [
      { x: -campusW / 2 - 2, z: roadZ + 3, type: "cypress" },
      { x: -campusW / 2 + 6, z: roadZ + 3, type: "oak" },
      { x: 0, z: roadZ + 3, type: "cypress" },
      { x: 8, z: roadZ + 3, type: "oak" },
      { x: campusW / 2 + 2, z: roadZ + 3, type: "cypress" },
      { x: roadX + 3, z: -campusD / 2 - 2, type: "oak" },
      { x: roadX + 3, z: 0, type: "cypress" },
      { x: roadX + 3, z: 6, type: "oak" },
      { x: roadX + 3, z: campusD / 2 + 2, type: "cypress" },
      { x: -14, z: -campusD / 2 - 3, type: "oak" },
      { x: -8, z: -campusD / 2 - 3, type: "cypress" },
      { x: 2, z: -campusD / 2 - 3, type: "oak" },
      { x: 10, z: -campusD / 2 - 3, type: "cypress" },
      { x: -campusW / 2 - 5, z: -8, type: "cypress" },
      { x: -campusW / 2 - 5, z: 4, type: "oak" },
    ];

    for (const t of treePositions) {
      if (t.type === "cypress") {
        this.createCypressTree(t.x, -0.32, t.z);
      } else {
        this.createLushOakTree(t.x, -0.32, t.z);
      }
    }

    // Street Lamps along roads
    const lampPositions = [
      { x: -8, z: roadZ - 0.4 },
      { x: 2, z: roadZ - 0.4 },
      { x: 12, z: roadZ - 0.4 },
      { x: roadX - 0.4, z: -6 },
      { x: roadX - 0.4, z: 4 },
      { x: roadX - 0.4, z: 12 },
    ];

    for (const lp of lampPositions) {
      this.createStreetLamp(lp.x, -0.22, lp.z);
    }
  }

  private createCypressTree(x: number, y: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 })
    );
    trunk.position.y = 0.4;
    trunk.castShadow = true;
    group.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 3.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.85 })
    );
    foliage.position.y = 2.4;
    foliage.castShadow = true;
    group.add(foliage);

    this.environmentGroup.add(group);
  }

  private createLushOakTree(x: number, y: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 })
    );
    trunk.position.y = 0.6;
    trunk.castShadow = true;
    group.add(trunk);

    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.8 });

    const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 6), leafMat1);
    c1.position.set(0, 2.0, 0);
    c1.castShadow = true;
    group.add(c1);

    const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 6), leafMat2);
    c2.position.set(0.4, 2.5, 0.2);
    c2.castShadow = true;
    group.add(c2);

    const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), leafMat1);
    c3.position.set(-0.35, 2.3, -0.3);
    c3.castShadow = true;
    group.add(c3);

    this.environmentGroup.add(group);
  }

  private createStreetLamp(x: number, y: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.8, 8), metalMat);
    pole.position.y = 1.4;
    pole.castShadow = true;
    group.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.06), metalMat);
    arm.position.set(0.3, 2.8, 0);
    group.add(arm);

    const lampHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.08, 0.16),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfef08a,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      })
    );
    lampHead.position.set(0.55, 2.76, 0);
    group.add(lampHead);

    this.environmentGroup.add(group);
  }

  // ------------------------------------------
  // 2. TERRAIN, LOTS & LANDSCAPED GARDENS
  // ------------------------------------------
  private buildTerrain(game: Game) {
    const slabGeo = new THREE.BoxGeometry(TILE_SIZE * 0.992, 0.22, TILE_SIZE * 0.992);

    const matOwnedLot = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65, metalness: 0.05 });
    const matGarden = new THREE.MeshStandardMaterial({ color: 0x228b48, roughness: 0.85, metalness: 0.02 });
    const matUnowned = new THREE.MeshStandardMaterial({ color: 0x3d7049, roughness: 0.92, metalness: 0.02 });
    const matSelected = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
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
        slab.position.set(posX, -0.11, posZ);
        slab.receiveShadow = true;
        slab.userData = { type: "tile", c, r };
        this.groundGroup.add(slab);
        this.interactiveMeshes.push(slab);

        // Rich decorative 3D park gardens on garden tiles
        if (tile.ground === "garden" && !tile.roomId && !tile.corridor) {
          this.createGardenFeatures(posX, 0, posZ);
        }

        // Surveyor stake markers on unowned parcels
        if (!isOwned && ((c + r) % 3 === 0)) {
          this.createSurveyorStake(posX, 0, posZ);
        }
      }
    }

    // Unowned parcel billboards: "LOTTO DISPONIBILE"
    for (const p of PARCELS) {
      if (game.owned.includes(p.id)) continue;

      const centerX = ((p.c0 + p.c1) / 2 - COLS / 2) * TILE_SIZE;
      const centerZ = ((p.r0 + p.r1) / 2 - ROWS / 2) * TILE_SIZE;

      const signGroup = new THREE.Group();
      signGroup.position.set(centerX, 0, centerZ);
      signGroup.userData = { type: "parcel", parcelId: p.id };

      const signPost1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
      );
      signPost1.position.set(-0.6, 0.9, 0);
      signPost1.castShadow = true;
      signGroup.add(signPost1);

      const signPost2 = signPost1.clone();
      signPost2.position.set(0.6, 0.9, 0);
      signGroup.add(signPost2);

      const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.0, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.2 })
      );
      signBoard.position.set(0, 1.5, 0);
      signBoard.castShadow = true;
      signGroup.add(signBoard);

      const signHeader = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.3, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
      );
      signHeader.position.set(0, 1.8, 0);
      signGroup.add(signHeader);

      this.groundGroup.add(signGroup);
      this.interactiveMeshes.push(signBoard);
    }
  }

  private createSurveyorStake(x: number, y: number, z: number) {
    const stake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.7, 6),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 })
    );
    stake.position.set(x + 0.4, y + 0.35, z + 0.4);
    stake.castShadow = true;
    this.groundGroup.add(stake);

    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.12, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 })
    );
    flag.position.set(x + 0.5, y + 0.65, z + 0.4);
    this.groundGroup.add(flag);
  }

  private createGardenFeatures(x: number, y: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Stone pathway slab
    const stone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.5, 0.06, 8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
    );
    stone.position.set(0, 0.03, 0);
    group.add(stone);

    // Tree
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 1.1, 6),
      new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.9 })
    );
    trunk.position.set(0.3, 0.55, 0.3);
    trunk.castShadow = true;
    group.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
    );
    foliage.position.set(0.3, 1.45, 0.3);
    foliage.castShadow = true;
    group.add(foliage);

    // Flowerbed with colorful blooms
    const flowerbed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0x3f2e1e, roughness: 0.95 })
    );
    flowerbed.position.set(-0.4, 0.06, -0.4);
    group.add(flowerbed);

    for (let f = 0; f < 4; f++) {
      const bloom = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 4),
        new THREE.MeshBasicMaterial({ color: f % 2 === 0 ? 0xf43f5e : 0xfbbf24 })
      );
      const ang = (f * Math.PI) / 2;
      bloom.position.set(-0.4 + Math.cos(ang) * 0.18, 0.18, -0.4 + Math.sin(ang) * 0.18);
      group.add(bloom);
    }

    this.groundGroup.add(group);
  }

  // ------------------------------------------
  // ------------------------------------------
  // 3. PRISTINE SANITARY CORRIDORS (AUTO-TILING & ADAPTIVE DIRECTION)
  // ------------------------------------------
  private buildCorridors(game: Game) {
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.15,
      metalness: 0.12,
    });
    const agvTrackMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const hubMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 });

    // Check if an adjacent tile connects to this corridor
    const isConnected = (nc: number, nr: number) => {
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return false;
      const t = game.tiles[nr]?.[nc];
      if (!t) return false;
      return Boolean(t.corridor || t.roomId);
    };

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = game.tiles[r]?.[c];
        if (!tile || !tile.corridor || tile.roomId) continue;

        const posX = (c - COLS / 2 + 0.5) * TILE_SIZE;
        const posZ = (r - ROWS / 2 + 0.5) * TILE_SIZE;

        // Cleanroom high-gloss terrazzo floor
        const walkFloor = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE * 0.98, 0.16, TILE_SIZE * 0.98), floorMat);
        walkFloor.position.set(posX, 0.08, posZ);
        walkFloor.receiveShadow = true;
        this.corridorsGroup.add(walkFloor);

        // Check 4 orthogonal neighbor connections
        const hasN = isConnected(c, r - 1);
        const hasS = isConnected(c, r + 1);
        const hasE = isConnected(c + 1, r);
        const hasW = isConnected(c - 1, r);
        const connCount = (hasN ? 1 : 0) + (hasS ? 1 : 0) + (hasE ? 1 : 0) + (hasW ? 1 : 0);

        // --- PROTECTIVE STAINLESS STEEL PERIMETER BUMPERS ---
        // Only placed on closed sides that do NOT connect to corridors or rooms!
        const curbThick = 0.05;
        const curbHeight = 0.06;
        const curbY = 0.12;

        if (!hasN) {
          const trimN = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE * 0.98, curbHeight, curbThick), bumperMat);
          trimN.position.set(posX, curbY, posZ - TILE_SIZE * 0.465);
          this.corridorsGroup.add(trimN);
        }
        if (!hasS) {
          const trimS = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE * 0.98, curbHeight, curbThick), bumperMat);
          trimS.position.set(posX, curbY, posZ + TILE_SIZE * 0.465);
          this.corridorsGroup.add(trimS);
        }
        if (!hasW) {
          const trimW = new THREE.Mesh(new THREE.BoxGeometry(curbThick, curbHeight, TILE_SIZE * 0.98), bumperMat);
          trimW.position.set(posX - TILE_SIZE * 0.465, curbY, posZ);
          this.corridorsGroup.add(trimW);
        }
        if (!hasE) {
          const trimE = new THREE.Mesh(new THREE.BoxGeometry(curbThick, curbHeight, TILE_SIZE * 0.98), bumperMat);
          trimE.position.set(posX + TILE_SIZE * 0.465, curbY, posZ);
          this.corridorsGroup.add(trimE);
        }

        // --- INTELLIGENT AGV LOGISTICS GUIDE NAVIGATION TRACKS ---
        const trackWidth = 0.22;
        const trackY = 0.165;

        // Center hub
        const centerHub = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, 0.015, trackWidth), agvTrackMat);
        centerHub.position.set(posX, trackY, posZ);
        this.corridorsGroup.add(centerHub);

        // If isolated tile (0 connections) or standard single orientation, default straight North-South
        if (connCount === 0) {
          const trackAlone = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, 0.015, TILE_SIZE * 0.9), agvTrackMat);
          trackAlone.position.set(posX, trackY, posZ);
          this.corridorsGroup.add(trackAlone);
        } else {
          // North branch
          if (hasN) {
            const trackN = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, 0.015, TILE_SIZE * 0.5), agvTrackMat);
            trackN.position.set(posX, trackY, posZ - TILE_SIZE * 0.25);
            this.corridorsGroup.add(trackN);
          }
          // South branch
          if (hasS) {
            const trackS = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, 0.015, TILE_SIZE * 0.5), agvTrackMat);
            trackS.position.set(posX, trackY, posZ + TILE_SIZE * 0.25);
            this.corridorsGroup.add(trackS);
          }
          // East branch
          if (hasE) {
            const trackE = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE * 0.5, 0.015, trackWidth), agvTrackMat);
            trackE.position.set(posX + TILE_SIZE * 0.25, trackY, posZ);
            this.corridorsGroup.add(trackE);
          }
          // West branch
          if (hasW) {
            const trackW = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE * 0.5, 0.015, trackWidth), agvTrackMat);
            trackW.position.set(posX - TILE_SIZE * 0.25, trackY, posZ);
            this.corridorsGroup.add(trackW);
          }

          // Intersection Hub Node for 3-way or 4-way junctions
          if (connCount >= 3) {
            const hubNode = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16), hubMat);
            hubNode.position.set(posX, trackY + 0.005, posZ);
            this.corridorsGroup.add(hubNode);
          }
        }
      }
    }
  }

  // ------------------------------------------
  // 4. CLEANROOM BUILDINGS & ADVANCED ARCHITECTURE
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

  // Helper to determine the single smartest door location for a room based on adjacent corridors
  private findSmartRoomDoor(room: Room, game: Game): { wall: "S" | "E" | "W" | "N"; relX: number; relZ: number; rotY: number } {
    const roomW = room.w * TILE_SIZE;
    const roomD = room.h * TILE_SIZE;
    const roomCenterX = (room.c + room.w / 2 - COLS / 2) * TILE_SIZE;
    const roomCenterZ = (room.r + room.h / 2 - ROWS / 2) * TILE_SIZE;

    // 1. Check South perimeter (preferred primary entrance facing camera)
    for (let c = room.c; c < room.c + room.w; c++) {
      const tile = game.tiles[room.r + room.h]?.[c];
      if (tile?.corridor) {
        const tileWorldX = (c + 0.5 - COLS / 2) * TILE_SIZE;
        return {
          wall: "S",
          relX: tileWorldX - roomCenterX,
          relZ: roomD / 2 - 0.08,
          rotY: 0,
        };
      }
    }

    // 2. Check East perimeter
    for (let r = room.r; r < room.r + room.h; r++) {
      const tile = game.tiles[r]?.[room.c + room.w];
      if (tile?.corridor) {
        const tileWorldZ = (r + 0.5 - ROWS / 2) * TILE_SIZE;
        return {
          wall: "E",
          relX: roomW / 2 - 0.08,
          relZ: tileWorldZ - roomCenterZ,
          rotY: -Math.PI / 2,
        };
      }
    }

    // 3. Check West perimeter
    for (let r = room.r; r < room.r + room.h; r++) {
      const tile = game.tiles[r]?.[room.c - 1];
      if (tile?.corridor) {
        const tileWorldZ = (r + 0.5 - ROWS / 2) * TILE_SIZE;
        return {
          wall: "W",
          relX: -roomW / 2 + 0.08,
          relZ: tileWorldZ - roomCenterZ,
          rotY: Math.PI / 2,
        };
      }
    }

    // 4. Check North perimeter
    for (let c = room.c; c < room.c + room.w; c++) {
      const tile = game.tiles[room.r - 1]?.[c];
      if (tile?.corridor) {
        const tileWorldX = (c + 0.5 - COLS / 2) * TILE_SIZE;
        return {
          wall: "N",
          relX: tileWorldX - roomCenterX,
          relZ: -roomD / 2 + 0.08,
          rotY: Math.PI,
        };
      }
    }

    // 5. Default fallback if no corridor touches room: center of South wall
    return {
      wall: "S",
      relX: 0,
      relZ: roomD / 2 - 0.08,
      rotY: 0,
    };
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

    // Find the single smart doorway location connecting to corridors
    const smartDoor = this.findSmartRoomDoor(room, game);

    // 1. FLOOR COLOR BASED ON OVERLAY MODE
    let floorColor = online ? theme.floor : 0x94a3b8;
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

    // High-gloss Cleanroom Floor Slab with subtle beveled border
    const floorGeo = new THREE.BoxGeometry(roomW * 0.98, 0.16, roomD * 0.98);
    const floorMat = new THREE.MeshStandardMaterial({
      color: floorColor,
      emissive: emissiveColor,
      emissiveIntensity: emissiveInt,
      roughness: 0.15,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = 0.08;
    floorMesh.receiveShadow = true;
    floorMesh.userData = { type: "room", roomId: room.id };
    roomRoot.add(floorMesh);
    this.interactiveMeshes.push(floorMesh);

    // Hazard / Dock Perimeter Warning Strip
    if (theme.motif === "hazard" || theme.motif === "dock") {
      const borderMat = new THREE.MeshBasicMaterial({ color: theme.trim });
      const border1 = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.96, 0.02, 0.08), borderMat);
      border1.position.set(0, 0.165, roomD * 0.44);
      roomRoot.add(border1);
      const border2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, roomD * 0.96), borderMat);
      border2.position.set(roomW * 0.44, 0.165, 0);
      roomRoot.add(border2);
    }

    // 2. CLEANROOM ARCHITECTURAL SANDWICH PANELS & VIEWING WINDOWS
    const wallHeight = 1.35 + (room.level - 1) * 0.4;
    const wallThick = 0.16;

    // Pristine Sterile White-Grey Sandwich Panel Material
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.08,
    });

    // Top aluminum coping cap
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.8,
      roughness: 0.2,
    });

    // Department Accent Baseboard Sanitary Coving
    const covingMat = new THREE.MeshStandardMaterial({
      color: theme.accent,
      roughness: 0.3,
      metalness: 0.15,
    });

    // Stainless steel protective dual bumper rails
    const bumperMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.15,
    });

    // Double-glazed Flush Viewing Glass
    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0xcffafe,
      transparent: true,
      opacity: 0.45,
      roughness: 0.08,
      metalness: 0.15,
    });

    // Overhead Cleanroom Recessed LED Troffer Light (illumination glow)
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: online ? 0.95 : 0.15,
      roughness: 0.1,
    });

    // --- NORTH WALL (REAR, Z-) ---
    const northGroup = new THREE.Group();
    northGroup.position.set(0, 0.16, -roomD / 2 + wallThick / 2);

    // North lower wall panel (0 to 0.55m)
    const northLower = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.55, wallThick), panelMat);
    northLower.position.y = 0.275;
    northLower.castShadow = true;
    northLower.receiveShadow = true;
    northGroup.add(northLower);

    // North baseboard sanitary coving
    const northCove = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.1, 0.04), covingMat);
    northCove.position.set(0, 0.05, wallThick / 2 + 0.01);
    northGroup.add(northCove);

    // North dual bumper rails
    const northBumper1 = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.05, 0.04), bumperMat);
    northBumper1.position.set(0, 0.26, wallThick / 2 + 0.01);
    northGroup.add(northBumper1);

    const northBumper2 = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.05, 0.04), bumperMat);
    northBumper2.position.set(0, 0.44, wallThick / 2 + 0.01);
    northGroup.add(northBumper2);

    // North large viewing window (0.55 to 1.15m)
    const northWindowW = roomW * 0.65;
    const northWindowH = 0.58;
    const northWindow = new THREE.Mesh(new THREE.BoxGeometry(northWindowW, northWindowH, 0.06), windowGlassMat);
    northWindow.position.set(0, 0.55 + northWindowH / 2, 0);
    northGroup.add(northWindow);

    // North window frame (brushed aluminum)
    const northFrameTop = new THREE.Mesh(new THREE.BoxGeometry(northWindowW + 0.1, 0.04, wallThick + 0.02), capMat);
    northFrameTop.position.set(0, 0.55 + northWindowH + 0.02, 0);
    northGroup.add(northFrameTop);

    const northFrameBottom = new THREE.Mesh(new THREE.BoxGeometry(northWindowW + 0.1, 0.04, wallThick + 0.02), capMat);
    northFrameBottom.position.set(0, 0.55 - 0.02, 0);
    northGroup.add(northFrameBottom);

    // North wall solid sides flanking window
    const northSideW = (roomW - northWindowW) / 2;
    if (northSideW > 0.05) {
      const northSideL = new THREE.Mesh(new THREE.BoxGeometry(northSideW, northWindowH, wallThick), panelMat);
      northSideL.position.set(-roomW / 2 + northSideW / 2, 0.55 + northWindowH / 2, 0);
      northSideL.castShadow = true;
      northGroup.add(northSideL);

      const northSideR = new THREE.Mesh(new THREE.BoxGeometry(northSideW, northWindowH, wallThick), panelMat);
      northSideR.position.set(roomW / 2 - northSideW / 2, 0.55 + northWindowH / 2, 0);
      northSideR.castShadow = true;
      northGroup.add(northSideR);
    }

    // North upper lintel panel (above window to wallHeight)
    const northUpperH = Math.max(0.15, wallHeight - (0.55 + northWindowH));
    const northUpper = new THREE.Mesh(new THREE.BoxGeometry(roomW, northUpperH, wallThick), panelMat);
    northUpper.position.set(0, 0.55 + northWindowH + northUpperH / 2, 0);
    northUpper.castShadow = true;
    northGroup.add(northUpper);

    // North top aluminum coping cap
    const northCap = new THREE.Mesh(new THREE.BoxGeometry(roomW + 0.04, 0.06, wallThick + 0.04), capMat);
    northCap.position.set(0, wallHeight + 0.03, 0);
    northGroup.add(northCap);

    // North overhead cleanroom LED troffer strip
    const northLed = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.85, 0.04, 0.18), ledMat);
    northLed.position.set(0, wallHeight - 0.04, wallThick / 2 + 0.09);
    northGroup.add(northLed);

    roomRoot.add(northGroup);

    // --- WEST WALL (REAR SIDE, X-) ---
    const westGroup = new THREE.Group();
    westGroup.position.set(-roomW / 2 + wallThick / 2, 0.16, 0);

    // West lower wall panel (0 to 0.55m)
    const westLower = new THREE.Mesh(new THREE.BoxGeometry(wallThick, 0.55, roomD), panelMat);
    westLower.position.y = 0.275;
    westLower.castShadow = true;
    westLower.receiveShadow = true;
    westGroup.add(westLower);

    // West baseboard sanitary coving
    const westCove = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, roomD), covingMat);
    westCove.position.set(wallThick / 2 + 0.01, 0.05, 0);
    westGroup.add(westCove);

    // West dual bumper rails
    const westBumper1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, roomD), bumperMat);
    westBumper1.position.set(wallThick / 2 + 0.01, 0.26, 0);
    westGroup.add(westBumper1);

    const westBumper2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, roomD), bumperMat);
    westBumper2.position.set(wallThick / 2 + 0.01, 0.44, 0);
    westGroup.add(westBumper2);

    // West viewing window
    const westWindowD = roomD * 0.65;
    const westWindowH = 0.58;
    const westWindow = new THREE.Mesh(new THREE.BoxGeometry(0.06, westWindowH, westWindowD), windowGlassMat);
    westWindow.position.set(0, 0.55 + westWindowH / 2, 0);
    westGroup.add(westWindow);

    // West window frame
    const westFrameTop = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.02, 0.04, westWindowD + 0.1), capMat);
    westFrameTop.position.set(0, 0.55 + westWindowH + 0.02, 0);
    westGroup.add(westFrameTop);

    const westFrameBottom = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.02, 0.04, westWindowD + 0.1), capMat);
    westFrameBottom.position.set(0, 0.55 - 0.02, 0);
    westGroup.add(westFrameBottom);

    const westSideD = (roomD - westWindowD) / 2;
    if (westSideD > 0.05) {
      const westSideBack = new THREE.Mesh(new THREE.BoxGeometry(wallThick, westWindowH, westSideD), panelMat);
      westSideBack.position.set(0, 0.55 + westWindowH / 2, -roomD / 2 + westSideD / 2);
      westSideBack.castShadow = true;
      westGroup.add(westSideBack);

      const westSideFront = new THREE.Mesh(new THREE.BoxGeometry(wallThick, westWindowH, westSideD), panelMat);
      westSideFront.position.set(0, 0.55 + westWindowH / 2, roomD / 2 - westSideD / 2);
      westSideFront.castShadow = true;
      westGroup.add(westSideFront);
    }

    const westUpperH = Math.max(0.15, wallHeight - (0.55 + westWindowH));
    const westUpper = new THREE.Mesh(new THREE.BoxGeometry(wallThick, westUpperH, roomD), panelMat);
    westUpper.position.set(0, 0.55 + westWindowH + westUpperH / 2, 0);
    westUpper.castShadow = true;
    westGroup.add(westUpper);

    // West top aluminum coping cap
    const westCap = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.04, 0.06, roomD + 0.04), capMat);
    westCap.position.set(0, wallHeight + 0.03, 0);
    westGroup.add(westCap);

    // West overhead cleanroom LED troffer strip
    const westLed = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, roomD * 0.85), ledMat);
    westLed.position.set(wallThick / 2 + 0.09, wallHeight - 0.04, 0);
    westGroup.add(westLed);

    roomRoot.add(westGroup);

    // --- FRONT LOW SANITARY CURBS (South & East) ADAPTED TO DOOR OPENING ---
    const curbHeight = 0.22;
    const doorGapWidth = 1.3;

    // Build South curb (with doorway opening if door is on South)
    if (smartDoor.wall === "S") {
      // Left segment of South curb
      const leftW = Math.max(0.1, smartDoor.relX - (-roomW / 2) - doorGapWidth / 2);
      if (leftW > 0.15) {
        const curbSLeft = new THREE.Mesh(new THREE.BoxGeometry(leftW, curbHeight, wallThick), panelMat);
        curbSLeft.position.set(-roomW / 2 + leftW / 2, curbHeight / 2 + 0.16, roomD / 2 - wallThick / 2);
        curbSLeft.castShadow = true;
        roomRoot.add(curbSLeft);

        const capSLeft = new THREE.Mesh(new THREE.BoxGeometry(leftW, 0.04, wallThick + 0.02), capMat);
        capSLeft.position.set(-roomW / 2 + leftW / 2, curbHeight + 0.18, roomD / 2 - wallThick / 2);
        roomRoot.add(capSLeft);
      }
      // Right segment of South curb
      const rightW = Math.max(0.1, roomW / 2 - (smartDoor.relX + doorGapWidth / 2));
      if (rightW > 0.15) {
        const curbSRight = new THREE.Mesh(new THREE.BoxGeometry(rightW, curbHeight, wallThick), panelMat);
        curbSRight.position.set(roomW / 2 - rightW / 2, curbHeight / 2 + 0.16, roomD / 2 - wallThick / 2);
        curbSRight.castShadow = true;
        roomRoot.add(curbSRight);

        const capSRight = new THREE.Mesh(new THREE.BoxGeometry(rightW, 0.04, wallThick + 0.02), capMat);
        capSRight.position.set(roomW / 2 - rightW / 2, curbHeight + 0.18, roomD / 2 - wallThick / 2);
        roomRoot.add(capSRight);
      }
    } else {
      // Solid South curb
      const southCurb = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.75, curbHeight, wallThick), panelMat);
      southCurb.position.set(-roomW * 0.1, curbHeight / 2 + 0.16, roomD / 2 - wallThick / 2);
      southCurb.castShadow = true;
      roomRoot.add(southCurb);

      const southCap = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.75, 0.04, wallThick + 0.02), capMat);
      southCap.position.set(-roomW * 0.1, curbHeight + 0.18, roomD / 2 - wallThick / 2);
      roomRoot.add(southCap);
    }

    // Build East curb (with doorway opening if door is on East)
    if (smartDoor.wall === "E") {
      // Back segment of East curb
      const backD = Math.max(0.1, smartDoor.relZ - (-roomD / 2) - doorGapWidth / 2);
      if (backD > 0.15) {
        const curbEBack = new THREE.Mesh(new THREE.BoxGeometry(wallThick, curbHeight, backD), panelMat);
        curbEBack.position.set(roomW / 2 - wallThick / 2, curbHeight / 2 + 0.16, -roomD / 2 + backD / 2);
        curbEBack.castShadow = true;
        roomRoot.add(curbEBack);

        const capEBack = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.02, 0.04, backD), capMat);
        capEBack.position.set(roomW / 2 - wallThick / 2, curbHeight + 0.18, -roomD / 2 + backD / 2);
        roomRoot.add(capEBack);
      }
      // Front segment of East curb
      const frontD = Math.max(0.1, roomD / 2 - (smartDoor.relZ + doorGapWidth / 2));
      if (frontD > 0.15) {
        const curbEFront = new THREE.Mesh(new THREE.BoxGeometry(wallThick, curbHeight, frontD), panelMat);
        curbEFront.position.set(roomW / 2 - wallThick / 2, curbHeight / 2 + 0.16, roomD / 2 - frontD / 2);
        curbEFront.castShadow = true;
        roomRoot.add(curbEFront);

        const capEFront = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.02, 0.04, frontD), capMat);
        capEFront.position.set(roomW / 2 - wallThick / 2, curbHeight + 0.18, roomD / 2 - frontD / 2);
        roomRoot.add(capEFront);
      }
    } else {
      // Solid East curb
      const eastCurb = new THREE.Mesh(new THREE.BoxGeometry(wallThick, curbHeight, roomD * 0.75), panelMat);
      eastCurb.position.set(roomW / 2 - wallThick / 2, curbHeight / 2 + 0.16, -roomD * 0.1);
      eastCurb.castShadow = true;
      roomRoot.add(eastCurb);

      const eastCap = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.02, 0.04, roomD * 0.75), capMat);
      eastCap.position.set(roomW / 2 - wallThick / 2, curbHeight + 0.18, -roomD * 0.1);
      roomRoot.add(eastCap);
    }

    // --- 3. DYNAMIC AIRLOCK ENTRANCE PORTAL & DECONTAMINATION STICKY MAT ---
    // Placed exactly on the selected smart connecting edge facing the corridor!
    this.createAirlockDoorPortal(
      roomRoot,
      smartDoor.relX,
      smartDoor.relZ,
      smartDoor.rotY,
      theme,
      online
    );

    // --- 4. BUILT-IN LAB CASEWORK & ENVIRONMENTAL TELEMETRY ---
    const benchW = Math.min(1.4, roomW * 0.45);
    const benchH = 0.46;
    const benchD = 0.38;
    const benchX = -roomW * 0.22;
    const benchZ = -roomD / 2 + wallThick + benchD / 2 + 0.02;

    const benchBody = new THREE.Mesh(
      new THREE.BoxGeometry(benchW, benchH, benchD),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.85 })
    );
    benchBody.position.set(benchX, 0.16 + benchH / 2, benchZ);
    benchBody.castShadow = true;
    benchBody.receiveShadow = true;
    roomRoot.add(benchBody);

    const benchTop = new THREE.Mesh(
      new THREE.BoxGeometry(benchW + 0.04, 0.04, benchD + 0.04),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.9 })
    );
    benchTop.position.set(benchX, 0.16 + benchH + 0.02, benchZ);
    roomRoot.add(benchTop);

    const emsDisplay = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.24, 0.04),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0284c7,
        emissiveIntensity: online ? 0.75 : 0.1,
        roughness: 0.2,
      })
    );
    emsDisplay.position.set(benchX, 0.16 + benchH + 0.32, -roomD / 2 + wallThick + 0.03);
    roomRoot.add(emsDisplay);

    // --- 5. LEVEL 2 & LEVEL 3 EXPANSION ARCHITECTURE ---
    if (room.level >= 2) {
      const hepa = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.14, 0.95),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
      );
      hepa.position.set(0, wallHeight + 0.08, 0);
      roomRoot.add(hepa);

      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, roomD * 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 })
      );
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(-roomW / 2 + wallThick + 0.06, wallHeight - 0.12, 0);
      roomRoot.add(pipe);
    }

    if (room.level >= 3) {
      const catwalk = new THREE.Mesh(
        new THREE.BoxGeometry(roomW * 0.85, 0.06, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 })
      );
      catwalk.position.set(0, wallHeight - 0.05, -roomD / 2 + 0.45);
      roomRoot.add(catwalk);

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(roomW * 0.85, 0.35, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
      );
      rail.position.set(0, wallHeight + 0.15, -roomD / 2 + 0.65);
      roomRoot.add(rail);

      const ladder = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, wallHeight, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
      );
      ladder.position.set(-roomW / 2 + 0.35, wallHeight / 2 + 0.16, -roomD / 2 + 0.25);
      roomRoot.add(ladder);
    }

    // 6. ALL EQUIPMENT IN SLOTS
    const anchors = anchorTiles(room);
    room.slots.forEach((slot, index) => {
      const tilePos = anchors[index];
      if (!tilePos) return;

      const slotWorldX = (tilePos.c + 0.5 - COLS / 2) * TILE_SIZE - posX;
      const slotWorldZ = (tilePos.r + 0.5 - ROWS / 2) * TILE_SIZE - posZ;

      if (!slot.item) {
        this.createEmptySlotMarker(roomRoot, slotWorldX, 0.16, slotWorldZ);
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

    // 7. ANIMATED STAFF AGENTS IN ROOM
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

    // 8. SELECTION HIGHLIGHT
    if (isSelected) {
      const box = new THREE.BoxHelper(floorMesh, 0xf59e0b);
      roomRoot.add(box);
    }

    this.buildingsGroup.add(roomRoot);
  }

  private createAirlockDoorPortal(
    parent: THREE.Group,
    x: number,
    z: number,
    rotY: number,
    theme: typeof ROOM_THEMES[keyof typeof ROOM_THEMES],
    online: boolean
  ) {
    const portalGroup = new THREE.Group();
    portalGroup.position.set(x, 0.16, z);
    portalGroup.rotation.y = rotY;

    const capMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.8, roughness: 0.2 });
    const covingMat = new THREE.MeshStandardMaterial({ color: theme.accent, roughness: 0.3, metalness: 0.15 });

    // 1. Blue Decontamination Sticky Mat (Dycem mat) placed just outside the doorway
    const stickyMat = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.015, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.2 })
    );
    stickyMat.position.set(0, 0.01, 0.35);
    portalGroup.add(stickyMat);

    // 2. Stainless Steel Door Jambs
    const jamb1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.12), capMat);
    jamb1.position.set(-0.55, 0.65, 0);
    portalGroup.add(jamb1);

    const jamb2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.12), capMat);
    jamb2.position.set(0.55, 0.65, 0);
    portalGroup.add(jamb2);

    // 3. Sliding glass airlock doors (partially parted)
    const glassDoorL = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.22, 0.03),
      new THREE.MeshStandardMaterial({
        color: 0xcffafe,
        transparent: true,
        opacity: 0.5,
        roughness: 0.1,
        metalness: 0.1,
      })
    );
    glassDoorL.position.set(-0.24, 0.63, 0);
    portalGroup.add(glassDoorL);

    const glassDoorR = glassDoorL.clone();
    glassDoorR.position.set(0.24, 0.63, 0);
    portalGroup.add(glassDoorR);

    // 4. Header Sign Board with Department Accent
    const headerBoard = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.26, 0.14), covingMat);
    headerBoard.position.set(0, 1.35, 0);
    headerBoard.castShadow = true;
    portalGroup.add(headerBoard);

    // 5. Cleanroom Classification Plaque (e.g., ISO 5, GMP A)
    const badgeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.14, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
    );
    badgeMesh.position.set(0, 1.35, 0);
    portalGroup.add(badgeMesh);

    // 6. Cleanroom Status LED Beacon (Green online, Red offline)
    const beaconColor = online ? 0x10b981 : 0xef4444;
    const beaconMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12),
      new THREE.MeshStandardMaterial({
        color: beaconColor,
        emissive: beaconColor,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      })
    );
    beaconMesh.position.set(0.42, 1.54, 0);
    portalGroup.add(beaconMesh);
    this.animatedEmissives.push({ mat: beaconMesh.material as THREE.MeshStandardMaterial, baseColor: beaconColor, speed: 3 });

    parent.add(portalGroup);
  }

  private createEmptySlotMarker(parent: THREE.Group, x: number, y: number, z: number) {
    const slotGroup = new THREE.Group();
    slotGroup.position.set(x, y, z);

    // 1. Sleek metallic equipment mounting pad
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.03, 0.92),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 })
    );
    pad.position.y = 0.015;
    slotGroup.add(pad);

    // 2. Stainless corner brackets with anchor bolts
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.15 });
    for (const bx of [-0.38, 0.38]) {
      for (const bz of [-0.38, 0.38]) {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.12), bracketMat);
        bracket.position.set(bx, 0.035, bz);
        slotGroup.add(bracket);
      }
    }

    // 3. Glowing holographic circular platform ring
    const ringGeo = new THREE.RingGeometry(0.24, 0.36, 20);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.035;
    slotGroup.add(ring);

    // 4. Floating holographic diamond target beacon
    const beaconGeo = new THREE.OctahedronGeometry(0.11, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 0.28;
    slotGroup.add(beacon);
    this.animatedSpinners.push({ mesh: beacon, speed: 2.5 });

    // Subtle upward holographic light column
    const beamGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.26, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 0.15;
    slotGroup.add(beam);

    parent.add(slotGroup);
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
            new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.6, roughness: 0.1 })
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
        new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.55, roughness: 0.08 })
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

    // Role-specific attire & accessories
    let suitColor = 0xffffff;
    let gloveColor = 0x38bdf8;
    let roleGemColor = 0x10b981;
    let headCoverColor = 0x38bdf8; // hair or bouffant cleanroom cap

    if (role === "operator") {
      suitColor = 0xf8fafc; // Cleanroom bunny suit jumpsuit
      gloveColor = 0x0284c7; // Blue nitrile gloves
      roleGemColor = 0x06b6d4; // Cyan gem
      headCoverColor = 0xe2e8f0; // White hood
    } else if (role === "scientist") {
      suitColor = 0xffffff; // Crisp white lab coat
      gloveColor = 0x10b981; // Green nitrile gloves
      roleGemColor = 0x10b981; // Emerald gem
      headCoverColor = 0x334155; // Dark hair
    } else if (role === "qa") {
      suitColor = 0xfef08a; // White coat with high-vis inspection vest
      gloveColor = 0xf59e0b;
      roleGemColor = 0xf59e0b; // Amber gem
      headCoverColor = 0x1e293b;
    } else if (role === "clinical") {
      suitColor = 0x3b82f6; // Hospital blue scrubs
      gloveColor = 0x60a5fa;
      roleGemColor = 0x3b82f6;
      headCoverColor = 0x1d4ed8;
    } else if (role === "regulatory") {
      suitColor = 0x1e293b; // Tailored charcoal executive suit
      gloveColor = 0x475569;
      roleGemColor = 0x8b5cf6;
      headCoverColor = 0x475569;
    } else if (role === "commercial") {
      suitColor = 0x0f766e; // Modern teal corporate suit
      gloveColor = 0x0d9488;
      roleGemColor = 0x14b8a6;
      headCoverColor = 0x78350f;
    }

    const suitMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.45 });
    const limbMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.5 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: gloveColor, roughness: 0.3 });

    // Torso with collar / lab coat cut
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.44, 8), suitMat);
    body.position.y = 0.39;
    body.castShadow = true;
    group.add(body);

    // ID Badge lanyard on chest
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    badge.position.set(0.04, 0.46, 0.13);
    group.add(badge);

    // Head (skin tone)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), skinMat);
    head.position.y = 0.69;
    head.castShadow = true;
    group.add(head);

    // Hair / Bouffant Cleanroom Cap
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.125, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: headCoverColor, roughness: 0.6 })
    );
    hairCap.position.y = 0.70;
    group.add(hairCap);

    // Safety Goggles Translucent Visor
    const goggles = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.05, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65, roughness: 0.1 })
    );
    goggles.position.set(0, 0.69, 0.09);
    group.add(goggles);

    // Legs with boots pivoting from the hip
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.06, 0.26, 0);
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.26, 6), limbMat);
    leftLeg.position.y = -0.13;
    leftLegGroup.add(leftLeg);
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.13), bootMat);
    leftBoot.position.set(0, -0.22, 0.02);
    leftLegGroup.add(leftBoot);
    group.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.06, 0.26, 0);
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.26, 6), limbMat);
    rightLeg.position.y = -0.13;
    rightLegGroup.add(rightLeg);
    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.13), bootMat);
    rightBoot.position.set(0, -0.22, 0.02);
    rightLegGroup.add(rightBoot);
    group.add(rightLegGroup);

    // Arms with gloves
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6), limbMat);
    leftArm.position.set(-0.16, 0.4, 0);
    group.add(leftArm);
    const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), gloveMat);
    leftGlove.position.set(-0.16, 0.26, 0);
    group.add(leftGlove);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6), limbMat);
    rightArm.position.set(0.16, 0.4, 0);
    group.add(rightArm);
    const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), gloveMat);
    rightGlove.position.set(0.16, 0.26, 0);
    group.add(rightGlove);

    // Held Prop: Tablet for Scientists / QA Clipboard / Commercial Briefcase
    if (role === "scientist" || role === "clinical") {
      const tablet = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.16, 0.02),
        new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          emissive: 0x0284c7,
          emissiveIntensity: 0.6,
          roughness: 0.2,
        })
      );
      tablet.position.set(0.14, 0.32, 0.12);
      tablet.rotation.x = -Math.PI / 4;
      group.add(tablet);
    } else if (role === "qa" || role === "regulatory") {
      const clipboard = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.16, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
      );
      clipboard.position.set(0.14, 0.32, 0.12);
      clipboard.rotation.x = -Math.PI / 4;
      group.add(clipboard);
    } else if (role === "commercial") {
      const briefcase = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.14, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.3 })
      );
      briefcase.position.set(0.22, 0.2, 0);
      group.add(briefcase);
    }

    // Floating 3D Role Diamond / Gem above head (Two Point Hospital / Sims style!)
    const roleGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.09, 0),
      new THREE.MeshStandardMaterial({
        color: roleGemColor,
        emissive: roleGemColor,
        emissiveIntensity: 0.75,
        roughness: 0.2,
      })
    );
    roleGem.position.set(0, 0.98, 0);
    group.add(roleGem);

    parent.add(group);

    const agent: StaffAgent = {
      id,
      role,
      roomId,
      group,
      leftLegGroup,
      rightLegGroup,
      leftArm,
      rightArm,
      head,
      roleGem,
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
      // Animate floating role gem
      if (agent.roleGem) {
        agent.roleGem.rotation.y += delta * 2.5;
        agent.roleGem.position.y = 0.98 + Math.sin(time * 3 + agent.seed) * 0.04;
      }

      agent.stateTimer -= delta;

      if (agent.state === "working") {
        agent.group.position.y = agent.currentPos.y + Math.sin(time * 3 + agent.seed) * 0.015;
        agent.rightArm.rotation.x = Math.sin(time * 4 + agent.seed) * 0.3 - 0.2;
        agent.leftArm.rotation.x = Math.cos(time * 3 + agent.seed) * 0.15;
        agent.leftLegGroup.rotation.x = 0;
        agent.rightLegGroup.rotation.x = 0;

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
          agent.leftLegGroup.rotation.x = 0;
          agent.rightLegGroup.rotation.x = 0;
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
          agent.leftLegGroup.rotation.x = Math.sin(agent.walkCycle) * 0.65;
          agent.rightLegGroup.rotation.x = -Math.sin(agent.walkCycle) * 0.65;
          agent.leftArm.rotation.x = -Math.sin(agent.walkCycle) * 0.5;
          agent.rightArm.rotation.x = Math.sin(agent.walkCycle) * 0.5;
          agent.group.position.y = agent.currentPos.y + Math.abs(Math.sin(agent.walkCycle)) * 0.035;
        }
      }
    }
  }

  private renderLoop() {
    this.animFrameId = requestAnimationFrame(this.renderLoop);
    if (this.isContextLost) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    const time = (now - this.startTime) / 1000;

    // Smooth fling inertia momentum when releasing finger
    if (!this.isDragging && (Math.abs(this.panVelocity.x) > 0.02 || Math.abs(this.panVelocity.z) > 0.02)) {
      this.camTarget.x += this.panVelocity.x * delta;
      this.camTarget.z += this.panVelocity.z * delta;
      this.clampCameraTarget();
      this.updateCameraPosition();
      this.panVelocity.x *= 0.88;
      this.panVelocity.z *= 0.88;
    }

    this.updateAnimations(delta, time);
    try {
      this.renderer.render(this.scene, this.camera);
    } catch {
      // Catch transient context loss on mobile
    }
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.clearGroup(this.environmentGroup);
    this.clearGroup(this.groundGroup);
    this.clearGroup(this.corridorsGroup);
    this.clearGroup(this.buildingsGroup);
    this.clearGroup(this.propsGroup);
    this.clearGroup(this.staffGroup);
    this.clearGroup(this.effectsGroup);
    this.clearGroup(this.phantomGroup);

    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

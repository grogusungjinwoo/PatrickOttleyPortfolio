declare module 'three' {
  export class Vector3 {
    x: number
    y: number
    z: number
    constructor(x?: number, y?: number, z?: number)
    set(x: number, y: number, z: number): this
  }

  export class BufferGeometry {
    setFromPoints(points: Vector3[]): this
    dispose(): void
  }

  export class Material {
    dispose(): void
  }

  export class Object3D {
    geometry?: BufferGeometry
    material?: Material | Material[]
    position: Vector3
    rotation: { x: number; y: number; z: number }
    scale: Vector3
    add(...objects: Object3D[]): void
  }

  export class WebGLRenderer {
    constructor(parameters?: { canvas?: HTMLCanvasElement; antialias?: boolean; alpha?: boolean })
    setPixelRatio(pixelRatio: number): void
    setSize(width: number, height: number, updateStyle?: boolean): void
    setClearColor(color: number, alpha?: number): void
    render(scene: Scene, camera: PerspectiveCamera): void
    dispose(): void
  }

  export class Scene extends Object3D {
    fog: Fog | null
    traverse(callback: (object: Object3D) => void): void
  }

  export class Fog {
    constructor(color: number, near: number, far: number)
  }

  export class PerspectiveCamera extends Object3D {
    aspect: number
    constructor(fov: number, aspect: number, near: number, far: number)
    lookAt(x: number, y: number, z: number): void
    updateProjectionMatrix(): void
  }

  export class AmbientLight extends Object3D {
    constructor(color: number, intensity?: number)
  }

  export class DirectionalLight extends Object3D {
    constructor(color: number, intensity?: number)
  }

  export class GridHelper extends Object3D {
    constructor(size: number, divisions: number, colorCenterLine?: number, colorGrid?: number)
  }

  export class Group extends Object3D {}

  export class BoxGeometry extends BufferGeometry {
    constructor(width: number, height: number, depth: number)
  }

  export class MeshStandardMaterial extends Material {
    constructor(parameters?: {
      color?: number
      emissive?: number
      opacity?: number
      roughness?: number
      transparent?: boolean
    })
  }

  export class LineBasicMaterial extends Material {
    constructor(parameters?: { color?: number; opacity?: number; transparent?: boolean })
  }

  export class Mesh extends Object3D {
    constructor(geometry: BufferGeometry, material: Material)
  }

  export class Line extends Object3D {
    constructor(geometry: BufferGeometry, material: Material)
  }
}

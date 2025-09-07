import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import {
  Physics,
  RigidBody,
  RapierRigidBody,
} from "@react-three/rapier";

function Player() {
  const ref = useRef<RapierRigidBody>(null);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [canJump, setCanJump] = useState(true); // ✅ jump control
  const { camera } = useThree();

  // --- Keyboard listeners ---
  useEffect(() => {
    const down = (e: KeyboardEvent) =>
      setKeys((k) => ({ ...k, [e.code]: true }));
    const up = (e: KeyboardEvent) =>
      setKeys((k) => ({ ...k, [e.code]: false }));
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // --- Game loop ---
  useFrame(() => {
    const body = ref.current;
    if (!body) return;

    const speed = 0.2;
    const impulse = new THREE.Vector3();
    const torque = new THREE.Vector3();

    // Movement
    if (keys["KeyW"] || keys["ArrowUp"]) {
      impulse.z -= speed;
      torque.x -= 0.2;
    }
    if (keys["KeyS"] || keys["ArrowDown"]) {
      impulse.z += speed;
      torque.x += 0.2;
    }
    if (keys["KeyA"] || keys["ArrowLeft"]) {
      impulse.x -= speed;
      torque.z += 0.2;
    }
    if (keys["KeyD"] || keys["ArrowRight"]) {
      impulse.x += speed;
      torque.z -= 0.2;
    }

    // --- Jump logic ---
    const vel = body.linvel();
    if (keys["Space"] && canJump) {
      impulse.y = 5;
      torque.x += 0.2;
      torque.z += 0.2;
      setCanJump(false); // ⛔ disable jump until landing
    }

    // detect landing (reset jump)
    if (!canJump && Math.abs(vel.y) < 0.05) {
      setCanJump(true);
    }

    // Apply impulses
    if (!impulse.equals(new THREE.Vector3())) body.applyImpulse(impulse, true);
    if (!torque.equals(new THREE.Vector3())) body.applyTorqueImpulse(torque, true);

    // Camera follows cube (with smoothing)
    const p = body.translation();
    const targetPos = new THREE.Vector3(p.x, p.y + 5, p.z + 10);
    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(p.x, p.y, p.z);
  });

  return (
    <RigidBody
      ref={ref}
      friction={1}
      lockRotations={true}
      colliders="cuboid"
      position={[0, 2, 0]} // start above ground
    >
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" flatShading />
      </mesh>
    </RigidBody>
  );
}


export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 6, 6], fov: 60 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        <Physics gravity={[0, -10, 0]}>
          <RigidBody type="fixed">
            <mesh position-y={-0.25} receiveShadow>
              <boxGeometry args={[20, 0.5, 20]} />
              <meshStandardMaterial color="mediumpurple" />
            </mesh>
          </RigidBody>
          <Player />
        </Physics>
      </Canvas>
    </div>
  );
}

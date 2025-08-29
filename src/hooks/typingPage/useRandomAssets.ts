import { useEffect, useState } from "react";

export function useRandomAssets(playCount: number) {
  const [enemyImg, setEnemyImg] = useState("");
  const [backgroundImg, setBackgroundImg] = useState("");

  useEffect(() => {
    const enemies = ["slime", "goblin", "dragon"];
    const e = enemies[Math.floor(Math.random() * enemies.length)];
    setEnemyImg(`./images/monster/${e}.png`);

    const b = Math.floor(Math.random() * 3);
    setBackgroundImg(`./images/background/${b}.png`);
  }, [playCount]);

  return { enemyImg, backgroundImg };
}

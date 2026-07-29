"use client";
import { FrequencyCharacter } from "../../frequency-character";
import { frequencyCharacterRegistry } from "../../../lib/frequency-characters";

export default function FrequencyCharacterGallery() {
  return <main className="frequency-gallery"><header><h1>주파 캐릭터 16종</h1><p>개발용 그래픽 프리셋 비교 화면</p></header><div className="frequency-gallery__grid">{Object.values(frequencyCharacterRegistry).map((definition) => <article key={definition.id}><FrequencyCharacter typeId={definition.id} variant="card" resultHz={definition.baseHz + (definition.id % 3 - 1) * 8} /><b>{definition.name} · {definition.baseHz} Hz</b><small>{definition.emotionState} · {definition.flow}</small><p>{definition.description}</p></article>)}</div></main>;
}

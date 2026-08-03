import { OriginStory } from "./origin-story";
import { NameInspiration } from "./name-inspiration";
import { CulturesMeeting } from "./cultures-meeting";
import { TradeRoutes } from "./trade-routes";
import { PieceStory } from "./piece-story";

export default function OurStory() {
  return (
    <>
      <OriginStory />
      <NameInspiration />
      <CulturesMeeting />
      <TradeRoutes />
      <PieceStory />
    </>
  );
}

import JoinCodeHandler from "./JoinCodeHandler";

export default function JoinCodePage({ params }: { params: { code: string } }) {
  return <JoinCodeHandler code={params.code} />;
}

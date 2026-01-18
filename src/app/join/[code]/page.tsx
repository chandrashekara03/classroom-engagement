import dynamic from "next/dynamic";
const JoinCodeHandler = dynamic(() => import("./JoinCodeHandler"), { ssr: false });

export default function JoinCodePage({ params }: { params: { code: string } }) {
  return <JoinCodeHandler code={params.code} />;
}

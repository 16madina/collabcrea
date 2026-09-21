import { useEffect, useState } from "react";
import { FeexPayProvider, FeexPayButton } from "@feexpay/react-sdk";
import "@feexpay/react-sdk/style.css";

// Page temporaire de diagnostic du formulaire FeexPay.
const FeexTest = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (window as any).__CC_FEEXPAY_PREFILL = {
      name: "Madina Diallo",
      email: "missdeemindset@gmail.com",
      country: "COTE_D_IVOIRE",
      network: "MOOV",
      phone: "0151995050",
    };
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="p-10">
      <FeexPayProvider>
        <FeexPayButton
          id="7CyXfoxfoauYi4X"
          token="fp_jt63XV7c59WinJb3gRSIygVsEB1rMbFw7Cfbme6u0eTIrdIWKwRSa2BswHo3GHs4"
          amount={440}
          description="Test"
          customId="test-1"
          case="MOBILE"
          mode="LIVE"
          currency="XOF"
          buttonText="Payer 440 FCFA"
          buttonClass="bg-black text-white px-4 py-2 rounded"
          callback={() => undefined}
        />
      </FeexPayProvider>
    </div>
  );
};

export default FeexTest;

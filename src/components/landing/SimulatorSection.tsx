import EarningsSimulator from "@/components/simulator/EarningsSimulator";
import { useNavigate } from "react-router-dom";

const SimulatorSection = () => {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate("/login");
  };

  return (
    <section id="simulador" className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10 mx-auto">
        <EarningsSimulator variant="barbearia" onCTA={handleCTA} />
      </div>
    </section>
  );
};

export default SimulatorSection;

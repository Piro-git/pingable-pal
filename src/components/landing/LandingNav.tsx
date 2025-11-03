import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LandingNavProps {
  navBackground: boolean;
}

export const LandingNav = ({ navBackground }: LandingNavProps) => {
  return (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-500 ${navBackground ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold bg-gradient-to-r from-[#14B8A6] to-[#0D9488] bg-clip-text text-transparent tracking-tight">
          FlowZen
        </div>
        <div className="flex items-center gap-8">
          <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-[#14B8A6] transition-colors">
            Pricing
          </a>
          <a href="#faq" className="text-sm font-medium text-gray-700 hover:text-[#14B8A6] transition-colors">
            Docs
          </a>
          <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-[#14B8A6] transition-colors">
            Login
          </Link>
          <Link to="/register">
            <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-lg px-6 shadow-lg hover:shadow-xl transition-all">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

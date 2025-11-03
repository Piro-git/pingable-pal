export const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-[#14B8A6] to-[#0D9488] bg-clip-text text-transparent mb-4">
              FlowZen
            </div>
            <p className="text-sm text-gray-500">hello@getflowzen.com</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#pricing" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Pricing</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Features</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Integrations</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Docs</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Changelog</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Status Page</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Privacy</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-400 text-center">© 2025 FlowZen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const Footer = () => {
  return (
    <footer className="bg-blue-950 m-0 h-[200px] text-yellow-300 py-6 px-4 mt-10 border-t border-yellow-700">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
        <div className="text-center sm:text-left">
          <p className="font-semibold text-yellow-400">FINESTA</p>
          <p>Invest Smarter. Invest Better.</p>
          <p className="text-yellow-500 mt-1">© {new Date().getFullYear()} Finesta Analytics</p>
        </div>

        <div className="flex gap-6 items-center">
          <a href="/about" className="hover:text-yellow-400 transition">About</a>
          <a href="/terms" className="hover:text-yellow-400 transition">Terms</a>
          <a href="/privacy" className="hover:text-yellow-400 transition">Privacy</a>
          <a href="https://github.com/yourrepo" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition">
            GitHub
          </a>
        </div>
      </div>

      <div className="mt-4 text-center text-yellow-500 text-xs">
        Built with by Sahil Beniwal • Powered by FastAPI + Gemini + Mern Stack
      </div>
    </footer>
  );
};

export default Footer;

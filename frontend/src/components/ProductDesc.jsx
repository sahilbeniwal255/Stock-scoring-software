import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ProductDesc = ({ mode }) => {
  const isDark = mode;

  const features = [
    {
      icon: <FaCheckCircle className="text-green-400 text-lg" />,
      title: "What the Investment Score Captures",
      items: [
        "A weighted blend of key financial metrics — PE, EPS, DCF, and sentiment.",
        "Each metric is normalized for fair comparison across sectors.",
        "Weights reflect strategic importance: fundamentals, valuation, perception.",
        "The score offers a fast snapshot of a company’s financial appeal.",
        "Ideal for ranking, filtering, and visualizing investment potential."
      ]
    },
    {
      icon: <FaTimesCircle className="text-red-400 text-lg" />,
      title: "What It Doesn’t Tell You",
      items: [
        "It doesn’t forecast future stock performance or price movement.",
        "It excludes macroeconomic trends, technical charts, and external forces.",
        "It’s not comparable across different scoring models or dashboards.",
        "It’s dynamic — logic and weights may evolve as the model improves."
      ]
    }
  ];

  return (
    <div className={`w-full px-6 rounded-lg transition-all duration-300 text-white`}>
      <h2 className="text-3xl font-bold text-yellow-400 mb-6 font-sans">📊 Understanding the Score</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((section, idx) => (
          <div key={idx} className="bg-blue-950 rounded-lg p-5 shadow-md border border-yellow-700">
            <div className="flex items-center gap-2 mb-3">
              {section.icon}
              <h3 className="text-lg font-semibold text-yellow-300">{section.title}</h3>
            </div>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed ml-2">
              {section.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 text-xs text-yellow-500 italic text-center">
        The score is a lens — not a verdict. Use it to guide deeper analysis, not replace it.
      </div>
    </div>
  );
};

export default ProductDesc;

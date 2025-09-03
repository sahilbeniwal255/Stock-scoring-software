import React, { useContext, useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { FinContext } from '../FinContext';
import CircularScore from './CircularScore';
import { GoogleGenAI } from "@google/genai";
import ScoreExplanationFormatted from './SCoreExplanantionFormatted';

const Score = () => {
  const { companyData, company } = useContext(FinContext);

  const genAI = new GoogleGenAI({apiKey: import.meta.env.VITE_GOOGLE_API_KEY});

  const [explanation, setExplanation] = useState("");

  const explainFn = async () => {
    if (totalScore) {
      const prompt = `
  You are a financial analysis assistant. Given the following normalized metrics and weights, explain how the final investment score was computed and interpret the result.

  Metrics:
  - Normalized PE: ${normalizedPE.toFixed(4)} (Weight: 10)
  - Normalized EPS: ${normalizedEPS.toFixed(4)} (Weight: 20)
  - Normalized DCF: ${(Math.min(dcf / companyData.regularMarketPrice, 2) / 2).toFixed(4)} (Weight: 20)
  - Sentiment Score: ${senScore.toFixed(4)} (Weight: 20)

  Final Score: ${totalScore.toFixed(2)} out of 70

  Instructions:
  1. Explain how each metric contributes to the score (value × weight).
  2. Highlight which metrics had the strongest and weakest impact.
  3. Comment on whether the score reflects strong fundamentals, valuation, or sentiment.
  4. If any metric is negative or zero, explain its impact.
  5. Use clear, non-technical language suitable for investors.

  Output format:
  - Contribution Breakdown
  - Interpretation
  - Strengths & Weaknesses
  - Overall Assessment
  give ouput in form of bullet points that can be directly used
  `;

      try {
        const response = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        });

        console.log(response.candidates[0].content.parts[0].text);
        setExplanation(response.candidates[0].content.parts[0].text);
      } catch (error) {
        console.error("Gemini error:", error.message);
      }
    }
  };


  const allSector = {
    Technology: ["AAPL", "MSFT", "GOOGL", "INTC", "AMD", "NVDA"],
    Healthcare: ["AMGN", "GILD", "VRTX", "BIIB", "REGN"],
    ConsumerServices: ["CMCSA", "NFLX", "SIRI", "ROKU"],
    Finance: ["SCHW", "PYPL", "INTU", "FITB"],
    Industrials: ["CTAS", "FAST", "ODFL", "CHRW"],
    ConsumerGoods: ["TSLA", "PEP", "MNST", "KDP"],
    Utilities: ["SRE", "NEE", "EXC"],
    Telecommunications: ["TMUS", "CHTR"],
    Energy: ["FANG", "OVV", "CTRA"],
    RealEstate: ["EQIX", "AMT", "SBAC"]
  };

  const [sector, setSector] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [maxEPS, setMaxEPS] = useState(0);
  const [minEPS, setMinEPS] = useState(Number.MAX_SAFE_INTEGER);
  const [normalizedEPS, setNormalizedEPS] = useState(0);
  const [maxPE, setMaxPE] = useState(0);
  const [minPE, setMinPE] = useState(Number.MAX_SAFE_INTEGER);
  const [medianPE, setMedianPE] = useState(0);
  const [normalizedPE, setNormalizedPE] = useState(0);
  const [dcf, setDCF] = useState(0);
  const [senScore, setSenScore] = useState(0);
  const [articles, setArticles] = useState([]);
  const [text, setText] = useState('');

  // Sector detection
  useEffect(() => {
    if (company) {
      for (const [key, companies] of Object.entries(allSector)) {
        if (companies.includes(company)) {
          setSector(key);
          break;
        }
      }
    }
  }, [company]);

  // Fetch symbols in sector
  useEffect(() => {
    if (sector && allSector[sector]) {
      setSymbols(allSector[sector]);
    }
  }, [sector]);

  // Fetch DCF
  useEffect(() => {
    if (company) {
      axios.get(`http://localhost:3001/api/stock/dcf/${company}`)
        .then(res => {
          const dcfValue = res.data?.dcf;
          if (typeof dcfValue === 'number') setDCF(dcfValue);
        })
        .catch(err => console.error('Error fetching DCF:', err.message));
    }
  }, [company]);

  // Fetch peer data
  useEffect(() => {
    const fetchPeers = async () => {
      if (!symbols.length) return;

      let localMaxEPS = 0, localMinEPS = Number.MAX_SAFE_INTEGER;
      let localMaxPE = 0, localMinPE = Number.MAX_SAFE_INTEGER;
      const peArray = [];

      for (const symbol of symbols) {
        try {
          const res = await axios.get(`http://localhost:3001/api/stock/${symbol}`);
          const { epsCurrentYear: eps, regularMarketPrice: price } = res.data;
          if (typeof eps === 'number' && typeof price === 'number' && eps !== 0) {
            const pe = price / eps;
            peArray.push(pe);
            localMaxEPS = Math.max(localMaxEPS, eps);
            localMinEPS = Math.min(localMinEPS, eps);
            localMaxPE = Math.max(localMaxPE, pe);
            localMinPE = Math.min(localMinPE, pe);
          }
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err.message);
        }
      }

      if (peArray.length) {
        peArray.sort((a, b) => a - b);
        const mid = Math.floor(peArray.length / 2);
        const median = peArray.length % 2 === 0
          ? (peArray[mid - 1] + peArray[mid]) / 2
          : peArray[mid];

        setMaxEPS(localMaxEPS);
        setMinEPS(localMinEPS);
        setMaxPE(localMaxPE);
        setMinPE(localMinPE);
        setMedianPE(median);
      }
    };

    fetchPeers();
  }, [symbols]);

  // Normalize PE and EPS
  useEffect(() => {
    if (!companyData?.epsCurrentYear || !companyData?.regularMarketPrice) return;

    const epsRange = maxEPS - minEPS;
    const peRange = maxPE - minPE;
    const cpe = companyData.regularMarketPrice / companyData.epsCurrentYear;

    setNormalizedEPS(epsRange === 0 ? 0 : (companyData.epsCurrentYear - minEPS) / epsRange);
    setNormalizedPE(peRange === 0 ? 0 : (cpe - medianPE) / peRange);
  }, [maxEPS, minEPS, maxPE, minPE, medianPE, companyData]);

  // Fetch news and build text
  useEffect(() => {
    const fetchNews = async () => {
      if (companyData) {
        try {
          const res = await axios.get(`http://localhost:3001/api/stock/news/${companyData.displayName}`);
          const articles = res.data.articles.slice(0, 5);
          const combinedText = articles.map(a => a.description).join(' ');
          setArticles(articles);
          setText(combinedText);
        } catch (err) {
          console.error('Error fetching news:', err.message);
        }
      }
    };

    fetchNews();
  }, [companyData]);

  // Compute sentiment score
  useEffect(() => {
    const computeSentiment = async () => {
      if (companyData && text.trim() !== '') {
        try {
          const res = await axios.post('http://127.0.0.1:8000/analyze', {
            text,
            entity: companyData.displayName
          });
          const last = res.data[res.data.length - 1];
          if (last?.score) setSenScore(last.score);
        } catch (err) {
          console.error('Error computing sentiment:', err.message);
        }
      }
    };

    computeSentiment();
  }, [text]);
  

  // Final weighted score
  const totalScore = useMemo(() => {
    const dcfPart = dcf !== 0 && companyData
      ? Math.min(dcf / companyData.regularMarketPrice, 2) / 2 * 20
      : 0;

    const sentimentPart = senScore === 0 ? 0 : senScore * 20;

    const val = normalizedPE * 10 + normalizedEPS * 20 + dcfPart + sentimentPart;
    return Number.isFinite(val) ? Math.max(0, Math.min(val, 60)) : 0;
  }, [normalizedPE, normalizedEPS, dcf, companyData, senScore]);

    useEffect(() => {
    if(normalizedEPS !== 0 && normalizedPE !== 0 && senScore !== 0 && totalScore) {
      explainFn();
    }
  }, [totalScore])


  return (
    <div className='flex flex-wrap overflow-auto sm:flex-col'>
      <table className="table-fixed border-collapse text-sm text-yellow-300 bg-blue-950 m-5">
        <thead className="bg-blue-900 sticky top-0">
          <tr>
            <th className="px-4 py-2 border border-yellow-300">Metric</th>
            <th className="px-4 py-2 border border-yellow-300">Value</th>
            <th className="px-4 py-2 border border-yellow-300">Weight</th>
            <th className="px-4 py-2 border border-yellow-300">Contribution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-2 border border-yellow-300">Normalized PE</td>
            <td className="px-4 py-2 border border-yellow-300">{normalizedPE.toFixed(4)}</td>
            <td className="px-4 py-2 border border-yellow-300">10</td>
            <td className="px-4 py-2 border border-yellow-300">{(normalizedPE * 10).toFixed(2)}</td>
          </tr>
          <tr>
            <td className="px-4 py-2 border border-yellow-300">Normalized EPS</td>
            <td className="px-4 py-2 border border-yellow-300">{normalizedEPS.toFixed(4)}</td>
            <td className="px-4 py-2 border border-yellow-300">20</td>
            <td className="px-4 py-2 border border-yellow-300">{(normalizedEPS * 20).toFixed(2)}</td>
          </tr>
          
          <tr>
            <td className="px-4 py-2 border border-yellow-300">Sentiment Score</td>
            <td className="px-4 py-2 border border-yellow-300">
              {senScore === 0 ? 'Loading...' : senScore.toFixed(4)}
            </td>
            <td className="px-4 py-2 border border-yellow-300">20</td>
            <td className="px-4 py-2 border border-yellow-300">
              {(senScore === 0 ? 0 : senScore * 20).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 border border-yellow-300">Normalized DCF</td>
            <td className="px-4 py-2 border border-yellow-300">
              {dcf !== 0 && companyData
                ? (Math.min(dcf / companyData.regularMarketPrice, 2) / 2).toFixed(4)
                : 'Loading...'}
            </td>
            <td className="px-4 py-2 border border-yellow-300">20</td>
            <td className="px-4 py-2 border border-yellow-300">
              {dcf !== 0 && companyData
                ? (Math.min(dcf / companyData.regularMarketPrice, 2) / 2 * 20).toFixed(2)
                : 'Loading...'}
            </td>
          </tr>
          <tr className="bg-blue-900 font-semibold">
            <td className="px-4 py-2 border border-yellow-300" colSpan={3}>Total Score</td>
            <td className="px-4 py-2 border border-yellow-300">
              {totalScore.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="m-5 ml-7 flex flex-col items-center gap-6 mb-10">
        <h1 className='text-yellow-400 font-sans font-bold text-xl'>Investment Score</h1>
        <CircularScore value={senScore === 0 ? 0 : totalScore} />
      </div>


      <div className='text-white m-2 p-5'>
        <h1 className='font-sans text-xl text-yellow-400 m-2 font-bold'>Explainability Layer</h1>
        {explanation === "" 
          ? <div className="text-yellow-300">Loading...</div> 
          : <ScoreExplanationFormatted explanation={explanation} />
        }
      </div>



    </div>
  );
};

export default Score;

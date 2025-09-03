import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ScoreExplanationFormatted = ({ explanation }) => {
  if (!explanation) return null;

  return (
    <div className="bg-blue-950 text-yellow-300 p-6 rounded-lg max-w-3xl mx-auto leading-relaxed text-sm">
      <ReactMarkdown
        children={explanation}
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, ...props }) => <h2 className="text-yellow-400 text-lg font-bold mt-4 mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-yellow-400 text-md font-semibold mt-3 mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="mb-3" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-3 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li {...props} />,
          strong: ({ node, ...props }) => <strong className="text-yellow-200" {...props} />,
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className="bg-blue-900 px-1 py-0.5 rounded text-yellow-200" {...props} />
            ) : (
              <pre className="bg-blue-900 p-3 rounded overflow-auto mb-3">
                <code {...props} />
              </pre>
            ),
        }}
      />
    </div>
  );
};

export default ScoreExplanationFormatted;

import { useState } from 'react';
import { X, Copy, Check, Printer, Download } from 'lucide-react';
import type { ItineraryItem } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItineraryItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    let md = `# TripWise Itinerary\n\n`;
    md += `*Generated on ${new Date().toLocaleDateString()} — Total Destinations: ${items.length}*\n\n`;
    md += `---\n\n`;

    items.forEach((item, idx) => {
      md += `### ${idx + 1}. ${item.name}\n`;
      md += `- **Location:** ${item.location}\n`;
      md += `- **Category:** ${item.category}\n`;
      if (item.visitDate) md += `- **Planned Date:** ${item.visitDate}\n`;
      if (item.notes) md += `- **Notes:** ${item.notes}\n`;
      if (item.description) md += `\n> ${item.description}\n`;
      md += `\n`;
    });

    return md;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tripwise-itinerary-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-900">Export Trip Plan</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Copy as Markdown, download JSON, or print your travel summary.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm font-mono bg-stone-50 border-b border-stone-200/80 max-h-96 text-stone-800 whitespace-pre-wrap select-all">
          {generateMarkdown()}
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>JSON</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F382C] hover:bg-[#164E3E] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

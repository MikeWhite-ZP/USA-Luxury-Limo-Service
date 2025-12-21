import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Settings, FileText, Printer, Copy, Check } from 'lucide-react';

interface ThemeConfig {
  primary: string;
  secondary: string;
}

export default function ExcuseNoteGenerator() {
  // Form state
  const [studentName, setStudentName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherName, setTeacherName] = useState('');
  const [parentSignature, setParentSignature] = useState('');
  const [schoolName, setSchoolName] = useState('');
  
  // Theme state
  const [theme, setTheme] = useState<ThemeConfig>({
    primary: '#2563eb',
    secondary: '#e0e7ff'
  });
  const [adminOpen, setAdminOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const letterRef = useRef<HTMLDivElement>(null);

  // Generate excuse letter text
  const generateLetter = () => {
    if (!studentName || !date || !teacherName || !parentSignature) {
      return null;
    }

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
Dear ${teacherName},

I am writing to explain the late arrival of my child, ${studentName}, to ${schoolName || 'school'} on ${formattedDate}.

${studentName} was studying late into the night preparing for upcoming examinations and unfortunately overslept this morning. As a result, I had to personally drop them off at school, which caused them to arrive later than usual.

I understand the importance of punctuality and assure you that we will take measures to ensure this does not happen again. Please excuse ${studentName}'s tardiness for this day.

Thank you for your understanding.

Sincerely,
${parentSignature}
(Parent/Guardian)
    `.trim();
  };

  const handleCopy = async () => {
    const letter = generateLetter();
    if (letter) {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (letterRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>School Excuse Note - ${studentName}</title>
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                padding: 40px; 
                line-height: 1.8;
                max-width: 600px;
                margin: 0 auto;
              }
              .letter { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="letter">${generateLetter()}</div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const letter = generateLetter();
  const isFormValid = studentName && date && teacherName && parentSignature;

  // CSS Variables style
  const themeStyle = {
    '--excuse-primary': theme.primary,
    '--excuse-secondary': theme.secondary,
    '--excuse-primary-hover': adjustBrightness(theme.primary, -15),
    '--excuse-text-on-primary': getContrastColor(theme.primary),
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen bg-gray-50 py-8 px-4 font-[Inter,system-ui,sans-serif]"
      style={themeStyle}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div 
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 shadow-lg"
            style={{ backgroundColor: 'var(--excuse-primary)' }}
          >
            <FileText className="w-7 h-7" style={{ color: 'var(--excuse-text-on-primary)' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">School Excuse Note Generator</h1>
          <p className="text-sm text-gray-500 mt-1">Generate a professional excuse letter in seconds</p>
        </div>

        {/* Admin Settings - Collapsible */}
        <div 
          className="rounded-xl border shadow-sm overflow-hidden"
          style={{ 
            borderColor: 'var(--excuse-secondary)',
            backgroundColor: '#ffffff'
          }}
        >
          <button
            onClick={() => setAdminOpen(!adminOpen)}
            className="w-full flex items-center justify-between p-4 text-left transition-colors"
            style={{ backgroundColor: adminOpen ? 'var(--excuse-secondary)' : 'transparent' }}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-sm text-gray-700">Admin Branding Settings</span>
            </div>
            {adminOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {adminOpen && (
            <div className="p-4 border-t space-y-4" style={{ borderColor: 'var(--excuse-secondary)' }}>
              <p className="text-xs text-gray-500 mb-3">
                Customize colors to match your school's branding. Changes apply instantly.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.primary}
                      onChange={(e) => setTheme(prev => ({ ...prev, primary: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.primary}
                      onChange={(e) => setTheme(prev => ({ ...prev, primary: e.target.value }))}
                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg font-mono"
                      placeholder="#2563eb"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.secondary}
                      onChange={(e) => setTheme(prev => ({ ...prev, secondary: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.secondary}
                      onChange={(e) => setTheme(prev => ({ ...prev, secondary: e.target.value }))}
                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg font-mono"
                      placeholder="#e0e7ff"
                    />
                  </div>
                </div>
              </div>
              {/* Preview swatches */}
              <div className="flex gap-2 pt-2">
                <div 
                  className="flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
                  style={{ 
                    backgroundColor: 'var(--excuse-primary)',
                    color: 'var(--excuse-text-on-primary)'
                  }}
                >
                  Primary
                </div>
                <div 
                  className="flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium border"
                  style={{ 
                    backgroundColor: 'var(--excuse-secondary)',
                    borderColor: 'var(--excuse-primary)',
                    color: '#374151'
                  }}
                >
                  Secondary
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div 
          className="rounded-xl border shadow-sm p-6 bg-white"
          style={{ borderColor: 'var(--excuse-secondary)' }}
        >
          <h2 
            className="text-lg font-semibold mb-4 pb-3 border-b"
            style={{ 
              color: 'var(--excuse-primary)',
              borderColor: 'var(--excuse-secondary)'
            }}
          >
            Student Information
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student's full name"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-shadow"
                  style={{ 
                    borderColor: '#d1d5db',
                    '--tw-ring-color': 'var(--excuse-primary)'
                  } as any}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Absence <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-shadow"
                  style={{ 
                    borderColor: '#d1d5db',
                    '--tw-ring-color': 'var(--excuse-primary)'
                  } as any}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g., Mr. Smith or Mrs. Johnson"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-shadow"
                  style={{ 
                    borderColor: '#d1d5db',
                    '--tw-ring-color': 'var(--excuse-primary)'
                  } as any}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g., Lincoln High School"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-shadow"
                  style={{ 
                    borderColor: '#d1d5db',
                    '--tw-ring-color': 'var(--excuse-primary)'
                  } as any}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent/Guardian Signature <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={parentSignature}
                onChange={(e) => setParentSignature(e.target.value)}
                placeholder="Enter parent/guardian full name"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-shadow"
                style={{ 
                  borderColor: '#d1d5db',
                  '--tw-ring-color': 'var(--excuse-primary)'
                } as any}
              />
            </div>
          </div>
        </div>

        {/* Letter Preview Card */}
        <div 
          className="rounded-xl border shadow-sm overflow-hidden bg-white"
          style={{ borderColor: 'var(--excuse-secondary)' }}
        >
          <div 
            className="px-6 py-4 flex items-center justify-between"
            style={{ backgroundColor: 'var(--excuse-secondary)' }}
          >
            <h2 
              className="text-lg font-semibold"
              style={{ color: 'var(--excuse-primary)' }}
            >
              Letter Preview
            </h2>
            {isFormValid && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ 
                    backgroundColor: copied ? '#10b981' : 'var(--excuse-primary)',
                    color: 'var(--excuse-text-on-primary)'
                  }}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-90"
                  style={{ 
                    borderColor: 'var(--excuse-primary)',
                    color: 'var(--excuse-primary)',
                    backgroundColor: 'white'
                  }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            )}
          </div>
          
          <div className="p-6" ref={letterRef}>
            {letter ? (
              <div 
                className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-serif p-6 rounded-lg border"
                style={{ 
                  backgroundColor: '#fefefe',
                  borderColor: 'var(--excuse-secondary)',
                  fontFamily: "'Georgia', serif"
                }}
              >
                {letter}
              </div>
            ) : (
              <div 
                className="text-center py-12 text-gray-400 text-sm"
                style={{ backgroundColor: '#f9fafb' }}
              >
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Fill in the form above to generate your excuse letter</p>
                <p className="text-xs mt-1">All required fields must be completed</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pt-4">
          This tool generates excuse letters for educational purposes only.
        </p>
      </div>
    </div>
  );
}

// Helper: Adjust brightness of hex color
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// Helper: Get contrast color (black or white) based on background
function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

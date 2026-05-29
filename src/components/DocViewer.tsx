/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { specificationData } from '../data/specification';
import { 
  FileText, Copy, Check, Download, Search, ChevronRight, 
  Settings, Award, Sparkles, Heart
} from 'lucide-react';

export default function DocViewer() {
  const [activeTab, setActiveTab] = useState<string>('arquitetura');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedDoc = specificationData.find((doc) => doc.id === activeTab) || specificationData[0];

  const handleCopy = (text: string, blockId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(blockId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleDownloadFullSQL = () => {
    // Locate database section DDL text
    const dbSection = specificationData.find((d) => d.id === 'database');
    if (!dbSection) return;
    
    // Extract SQL block
    const sqlRegex = /```sql([\s\S]*?)```/;
    const match = dbSection.content.match(sqlRegex);
    const sqlText = match ? match[1].trim() : dbSection.content;

    const blob = new Blob([sqlText], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'banco-de-dados-espaco-holos.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredDocs = specificationData.filter((doc) => {
    if (!searchQuery) return true;
    return (
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="bg-white border border-warm-200 rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8" id="specification-viewer-container">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-warm-100 pb-6 mb-8">
        <div>
          <span className="text-terapia-700 text-xs font-sans font-bold tracking-wider uppercase bg-terapia-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            MANUAL DE ARQUITETURA
          </span>
          <h2 className="text-2xl font-serif font-semibold text-warm-950 tracking-tight mt-2 flex items-center gap-2">
            Especificações e Engenharia do Sistema
          </h2>
          <p className="text-warm-850 text-sm mt-1">
            Manual de referência técnica idealizado para explicar as diretrizes de desenvolvimento estrutural, segurança, LGPD e banco de dados.
          </p>
        </div>

        <button
          onClick={handleDownloadFullSQL}
          className="flex items-center gap-2 bg-terapia-700 hover:bg-terapia-700/90 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all tracking-wide shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Baixar Script SQL Completo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-warm-350 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Pesquisar nos tópicos técnicos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-warm-50 border border-warm-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-warm-950 focus:outline-none focus:border-terapia-700 font-sans"
            />
          </div>

          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1" id="doc-tabs-navigation">
            {filteredDocs.map((doc) => {
              const isActive = activeTab === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveTab(doc.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 relative cursor-pointer ${
                    isActive
                      ? 'bg-terapia-50 border-terapia-700 text-terapia-700'
                      : 'bg-warm-50/40 border-warm-200 text-warm-950 hover:bg-warm-50'
                  }`}
                >
                  <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-terapia-700' : 'text-warm-350'}`} />
                  <div className="space-y-1">
                    <span className="block text-[9px] font-sans tracking-wide font-bold opacity-80 uppercase leading-none">
                      {doc.category}
                    </span>
                    <span className="block text-xs font-bold leading-relaxed text-warm-950">
                      {doc.title}
                    </span>
                    <span className="block text-[10px] text-warm-850 line-clamp-1">
                      {doc.summary}
                    </span>
                  </div>
                  {isActive && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-terapia-700">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Board */}
        <div className="lg:col-span-8 bg-warm-50/40 border border-warm-200 rounded-2xl p-6 sm:p-8 max-h-[580px] overflow-y-auto" id="selected-doc-content-viewer">
          {/* Quick Category indicator */}
          <div className="flex items-center justify-between text-[11px] text-warm-850 font-sans border-b border-warm-200 pb-4 mb-6">
            <span className="uppercase text-terapia-700 font-bold tracking-wider">{selectedDoc.category}</span>
            <span className="bg-terapia-55 bg-terapia-50 border border-terapia-200 px-2.5 py-0.5 rounded-full text-terapia-700 font-medium font-sans">Pronto para Codificação</span>
          </div>

          {/* Render parsed text blocks with customized high fidelity inline parsing */}
          <div className="prose prose-slate max-w-none text-warm-950 text-sm leading-relaxed space-y-6">
            <h1 className="text-xl font-serif font-bold text-warm-950 tracking-tight">{selectedDoc.title}</h1>
            
            <p className="text-terapia-700 border-l-2 border-terapia-700 pl-4 py-1.5 italic font-sans bg-terapia-50 text-xs rounded-r-lg">
              {selectedDoc.summary}
            </p>

            {/* Structured textual body formatter */}
            {selectedDoc.content.split('\n\n').map((paragraph, idx) => {
              // 1. Check for Code Blocks (Starts and ends with ```)
              if (paragraph.trim().startsWith('```') && paragraph.trim().endsWith('```')) {
                // Parse code and language
                const rawLines = paragraph.trim().split('\n');
                const firstLine = rawLines[0];
                const cleanLang = firstLine.replace('```', '') || 'code';
                const codeOnly = rawLines.slice(1, rawLines.length - 1).join('\n');
                
                return (
                  <div key={idx} className="relative group bg-white border border-warm-200 rounded-xl overflow-hidden my-4 font-mono text-xs">
                    <div className="flex items-center justify-between bg-warm-50 px-4 py-2.5 border-b border-warm-200 text-[10px] text-warm-950 uppercase tracking-wider leading-none font-bold">
                      <span>CÓDIGO {cleanLang.toUpperCase()}</span>
                      <button
                        onClick={() => handleCopy(codeOnly, `p-${idx}`)}
                        className="p-1 text-warm-850 hover:text-terapia-700 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copiar código para área de transferência"
                      >
                        {copiedId === `p-${idx}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-terapia-700" />
                            <span className="text-terapia-700">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-warm-950 select-text leading-relaxed whitespace-pre font-mono bg-white text-[11px]">
                      {codeOnly}
                    </pre>
                  </div>
                );
              }

              // 2. Headings (Markdown Style)
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-base font-serif font-bold text-warm-955 pt-4 border-b border-warm-101 border-warm-200 pb-2">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('#### ')) {
                return (
                  <h4 key={idx} className="text-sm font-sans font-bold text-terapia-700 pt-3">
                    {paragraph.replace('#### ', '')}
                  </h4>
                );
              }

              // 3. Bullets (Markdown style Lists)
              if (paragraph.startsWith('* ')) {
                return (
                  <ul key={idx} className="list-disc pl-5 space-y-2 text-warm-850 font-sans">
                    {paragraph.split('\n').map((line, lIdx) => (
                      <li key={lIdx} className="leading-relaxed">
                        {line.replace(/^\*\s+/, '').replace(/^\-\s+/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }

              // 4. Custom formatted Table
              if (paragraph.includes('|') && paragraph.split('\n').length > 1) {
                const tableRows = paragraph.split('\n');
                const headerCols = tableRows[0].split('|').map(c => c.trim()).filter(Boolean);
                const valueRows = tableRows.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean)).filter(r => r.length > 0);

                return (
                  <div key={idx} className="overflow-x-auto my-4 border border-warm-200 rounded-xl bg-white shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-warm-50 border-b border-warm-200 text-warm-955 font-sans font-bold">
                          {headerCols.map((col, cIdx) => (
                            <th key={cIdx} className="p-3 uppercase tracking-wider">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-200 text-warm-850">
                        {valueRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-warm-50/20 transition-colors">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="p-3 whitespace-normal align-top leading-relaxed">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              // Default standard paragraph text
              return (
                <p key={idx} className="leading-relaxed text-warm-950 font-sans h-[auto] whitespace-normal">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

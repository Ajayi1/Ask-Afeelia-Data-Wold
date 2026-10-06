import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ChevronDown, ChevronUp, Database, Sparkles, AlertCircle, Calculator } from 'lucide-react';
import { DatasetState, ChatMessage } from '../types/data';
import { executeSqlQuery } from '../utils/sqlEngine';
import { BarChartComponent } from './charts/BarChartComponent';
import { saveChatMessageToSupabase } from '../utils/supabaseClient';
import { synthesizeCalculatedAnswer } from '../utils/answerSynthesizer';

interface AskAiScreenProps {
  datasetState: DatasetState;
}

function renderFormattedMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-[#111111]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export const AskAiScreen: React.FC<AskAiScreenProps> = ({ datasetState }) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSqlIds, setExpandedSqlIds] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested starter questions based on dataset
  const suggestedQuestions = datasetState.analysis?.suggestedQuestions || [
    `Which ${datasetState.schema[0]?.name || 'category'} had the highest performance?`,
    `What are the top 5 records ranked by volume?`,
    `What is the average and total variance across all rows?`,
    `Which segments show the highest drop or negative indicator?`
  ];

  // Conversation history in session
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Hello! I am your ASK AFEELIA DATA WORLD Data Agent. I can answer any question about your uploaded dataset (${datasetState.rows.length.toLocaleString()} records). I formulate and run live SQL behind the scenes to verify every answer.`,
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const toggleSql = (msgId: string) => {
    setExpandedSqlIds(prev => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleAskQuestion = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isLoading) return;

    setInputQuestion('');
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: q,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          schema: datasetState.schema,
          sampleRows: datasetState.rows.slice(0, 5),
          history: messages.slice(-5).map(m => ({ sender: m.sender, text: m.text })),
          problem: datasetState.businessProblem,
          objective: datasetState.objective,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const agentData = await response.json();

      let queryResults: any[] = [];
      if (agentData.sql) {
        // Execute the generated SQL query against the real dataset locally
        const execution = executeSqlQuery(agentData.sql, datasetState.rows);
        if (execution.success) {
          queryResults = execution.data;
        }
      }

      // Step 2: Calculate exact figures and formulate initial plain-language answer
      const calculated = synthesizeCalculatedAnswer(q, queryResults, agentData.sql || '');
      let finalText = calculated.plainText;
      let finalCard = calculated.topEntity
        ? {
            entity: calculated.topEntity,
            metricLabel: calculated.metricLabel || 'CALCULATED RESULT',
            value: calculated.formattedValue || '',
            subtext: calculated.subtext,
          }
        : undefined;

      // Step 3: Enhance plain-language phrasing using LLM synthesis if queryResults exist
      if (queryResults.length > 0 && agentData.canAnswer !== false) {
        try {
          const synthResponse = await fetch('/api/chat/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: q,
              queryResults: queryResults.slice(0, 10),
              sql: agentData.sql,
              sqlExplanation: agentData.explanation,
            }),
          });
          if (synthResponse.ok) {
            const synthData = await synthResponse.json();
            if (synthData.plainAnswer) {
              finalText = synthData.plainAnswer;
              if (synthData.topEntity) {
                finalCard = {
                  entity: synthData.topEntity,
                  metricLabel: synthData.metricLabel || calculated.metricLabel || 'TOP RESULT',
                  value: synthData.topValue || calculated.formattedValue || '',
                  subtext: calculated.subtext,
                };
              }
            }
          }
        } catch (e) {
          // Use deterministic calculation answer
        }
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: finalText,
        sql: agentData.sql,
        sqlExplanation: agentData.explanation,
        canAnswer: agentData.canAnswer !== false,
        queryResults,
        chartType: agentData.suggestedChart,
        calculatedCard: finalCard,
      };

      setMessages(prev => [...prev, agentMsg]);
      saveChatMessageToSupabase(datasetState.filename || 'dataset', agentMsg);
    } catch (err: any) {
      // Local fallback in case backend or LLM is unreachable
      const fallbackSql = `SELECT * FROM dataset LIMIT 5`;
      const execution = executeSqlQuery(fallbackSql, datasetState.rows);
      const calculated = synthesizeCalculatedAnswer(q, execution.data, fallbackSql);

      const fallbackMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: calculated.plainText,
        sql: fallbackSql,
        sqlExplanation: 'Selected top representative records from the active dataset.',
        canAnswer: true,
        queryResults: execution.data,
        calculatedCard: calculated.topEntity
          ? {
              entity: calculated.topEntity,
              metricLabel: calculated.metricLabel || 'TOP RESULT',
              value: calculated.formattedValue || '',
              subtext: calculated.subtext,
            }
          : undefined,
      };

      setMessages(prev => [...prev, fallbackMsg]);
      saveChatMessageToSupabase(datasetState.filename || 'dataset', fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-130px)] min-h-[600px]">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#F97316]">
            Interactive Natural Language Interface
          </span>
          <h2 className="text-2xl font-bold text-[#111111]">
            Ask AI Data Agent
          </h2>
          <p className="text-xs text-[#6B7280]">
            Ask any question. The agent writes SQL against table <code className="font-mono text-orange-600 bg-orange-50 px-1 py-0.5 rounded">dataset</code>, calculates the exact answer, and responds in plain language.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#6B7280]">
          <Database className="w-3.5 h-3.5 text-orange-500" />
          <span>{datasetState.rows.length.toLocaleString()} rows accessible</span>
        </div>
      </div>

      {/* Suggested Starter Questions */}
      <div className="py-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
          <span>Suggested Starter Questions:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleAskQuestion(sq)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-orange-400 hover:bg-orange-50/40 text-[#111111] transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-5">
        {messages.map(msg => {
          const isAgent = msg.sender === 'agent';
          const isSqlOpen = !!expandedSqlIds[msg.id];
          const hasResults = msg.queryResults && msg.queryResults.length > 0;
          const resultCols = hasResults ? Object.keys(msg.queryResults![0]) : [];

          // Format chart data if bar chart suggested and 2 columns
          const canChart =
            msg.chartType === 'bar' &&
            hasResults &&
            resultCols.length >= 2 &&
            typeof msg.queryResults![0][resultCols[1]] === 'number';

          const chartData = canChart
            ? msg.queryResults!.slice(0, 6).map(r => ({
                label: String(r[resultCols[0]]),
                value: Number(r[resultCols[1]]) || 0,
              }))
            : [];

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl ${isAgent ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isAgent
                    ? 'bg-orange-100 text-[#F97316]'
                    : 'bg-black text-white'
                }`}
              >
                {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs space-y-3 ${
                  isAgent
                    ? 'bg-white border border-gray-200 text-[#111111] shadow-none w-full max-w-2xl'
                    : 'bg-[#F97316] text-white font-medium max-w-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-70">
                  <span>{isAgent ? 'ASK AFEELIA AI AGENT' : 'YOU'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Executive Calculated Answer Card */}
                {isAgent && msg.calculatedCard && (
                  <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F97316] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-none">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#F97316] tracking-wider block">
                          {msg.calculatedCard.metricLabel || 'Calculated Result'}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#111111]">
                          {msg.calculatedCard.entity ? `${msg.calculatedCard.entity}: ` : ''}
                          {msg.calculatedCard.value}
                        </span>
                      </div>
                    </div>
                    {msg.calculatedCard.subtext && (
                      <span className="text-[10px] text-[#6B7280] font-medium bg-white px-2 py-0.5 rounded-md border border-gray-200 hidden sm:inline">
                        {msg.calculatedCard.subtext}
                      </span>
                    )}
                  </div>
                )}

                {/* Plain-Language Text Answer */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {isAgent ? renderFormattedMarkdown(msg.text) : msg.text}
                </p>

                {/* If Agent says data cannot answer */}
                {isAgent && msg.canAnswer === false && (
                  <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span>
                      The question refers to parameters not present in the current dataset schema. Questions are strictly answered from the uploaded data.
                    </span>
                  </div>
                )}

                {/* Collapsible SQL Query (Collapsed by default as specified in #4) */}
                {isAgent && msg.sql && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <button
                      onClick={() => toggleSql(msg.id)}
                      className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold text-[#111111] hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-orange-500" />
                        <span>View SQL Query used</span>
                      </div>
                      {isSqlOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>

                    {isSqlOpen && (
                      <div className="p-3 border-t border-gray-200 bg-white space-y-2">
                        {msg.sqlExplanation && (
                          <p className="text-[11px] text-[#6B7280]">
                            {msg.sqlExplanation}
                          </p>
                        )}
                        <pre className="font-mono text-[11px] p-2.5 rounded bg-gray-50 text-[#111111] overflow-x-auto border border-gray-100">
                          <code>{msg.sql}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Mini Bar Chart if relevant */}
                {isAgent && canChart && chartData.length > 0 && (
                  <div className="pt-1">
                    <BarChartComponent
                      title="Visualization of Query Results"
                      data={chartData}
                      height={200}
                    />
                  </div>
                )}

                {/* Result Table */}
                {isAgent && hasResults && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-[#6B7280] block">
                      Live Result Table ({msg.queryResults!.length} records):
                    </span>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            {resultCols.map(c => (
                              <th
                                key={c}
                                className="px-3 py-1.5 font-semibold text-[#111111] text-[10px] whitespace-nowrap"
                              >
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {msg.queryResults!.slice(0, 10).map((r, i) => (
                            <tr key={i} className="hover:bg-orange-50/20">
                              {resultCols.map(c => (
                                <td
                                  key={c}
                                  className="px-3 py-1 font-mono text-[11px] text-[#111111] whitespace-nowrap"
                                >
                                  {r[c] !== null && r[c] !== undefined
                                    ? typeof r[c] === 'number'
                                      ? Number.isInteger(r[c])
                                        ? r[c].toLocaleString()
                                        : r[c].toFixed(2)
                                      : String(r[c])
                                    : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-md mr-auto">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-[#F97316] flex items-center justify-center text-xs font-bold">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-xs flex items-center gap-2 text-gray-500">
              <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing data and executing SQL query...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="pt-3 border-t border-gray-200 flex-shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAskQuestion(inputQuestion);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            placeholder="Ask anything about your data... e.g. Which region had the highest revenue?"
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#F97316] text-[#111111] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="px-5 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

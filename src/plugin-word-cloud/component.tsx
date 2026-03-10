import * as React from 'react';
import { useEffect, useState, useRef } from 'react'; // Removed useMemo, added useRef
import * as d3 from 'd3';
import * as cloud from 'd3-cloud'; // Changed to namespace import
import { scaleOrdinal } from 'd3-scale'; // Using d3-scale for colors potentially
import { intlMessages } from '../intlMessages';

import {
  PublicChatMessagesData,
  ChatMessage,
  PluginWordCloudProps,
} from './types';
import { PUBLIC_CHAT_MESSAGES_SUBSCRIPTION } from './queries';

// Define an interface for the word data including the count and category, extending d3-cloud's Word
interface WordData extends cloud.Word {
  count: number;
  category: string; // Added category field
  // text and size are already part of cloud.Word
}

// Regex to match various emoji presentations, including flags and variation selectors
// Using Unicode property escapes: \p{Emoji_Presentation}, \p{Emoji} with VS16, Regional Indicators for flags
// More restrictive to avoid matching Unicode numbers
const emojiIsolatingRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|(?:\p{Regional_Indicator}){2})/gu;

// More restrictive URL regex - matches common URL patterns
const urlRegex = /^(https?:\/\/|ftp:\/\/|www\.)/i;

// Regex to validate words - must contain at least one letter (any language) or be an emoji
// This filters out pure numbers, symbols, and other non-word content
const validWordRegex = /^[\p{L}\p{M}]+$/u;

// Regex to check if a string is an emoji (simple check)
const isEmojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;

// Minimum word length to include (helps filter out noise)
const MIN_WORD_LENGTH = 2;
// Maximum word length to include (avoids very long words that don't fit well)
const MAX_WORD_LENGTH = 30;

const extractWords = (text: string): string[] => {
  if (!text) return [];

  // 1. Isolate emojis by adding spaces around them
  const spacedText = text.replace(emojiIsolatingRegex, ' $1 ');

  // 2. Convert to lowercase (emojis are generally unaffected, but standard words are)
  const lowerCaseText = spacedText.toLowerCase();

  // 3. Split by whitespace first to get individual tokens
  const tokens = lowerCaseText.split(/\s+/);

  // 4. Filter and process each token
  const words = tokens
    .filter((token) => {
      if (token.length === 0) return false;
      // Filter out URLs BEFORE removing punctuation
      if (urlRegex.test(token)) return false;
      // Reject tokens where letters are preceded or succeeded by numbers
      // e.g., "3test", "test3", "te3st", "3test3"
      if (/\d[a-zA-Z]|[a-zA-Z]\d/.test(token)) return false;
      return true;
    })
    .map((token) => {
      // Remove common punctuation from each word (including parentheses, brackets, etc.)
      return token.replace(/[.,!?;:()[\]{}'"<>*#@&^%$~`\\|/+=_-]/g, '');
    })
    .filter((word) => {
      // Filter out empty strings after punctuation removal
      if (word.length === 0) return false;
      // Allow emojis
      if (isEmojiRegex.test(word)) return true;
      // Require minimum length for words
      if (word.length < MIN_WORD_LENGTH) return false;
      // Reject words exceeding maximum length
      if (word.length > MAX_WORD_LENGTH) return false;
      // Only allow words that contain at least one letter (filters out pure numbers/symbols)
      return validWordRegex.test(word);
    });

  return words;
};

export function PluginWordCloud({ pluginApi, intl, activatedAt }: PluginWordCloudProps):
React.ReactElement<PluginWordCloudProps> {
  // State to store GLOBAL word counts (for font size)
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  // State to store word counts PER CATEGORY (minute) (for layout grouping)
  const [categorizedWordCounts, setCategorizedWordCounts] = useState<Record<string, Record<string, number>>>({});
  // State to keep track of processed messages with their content and category (to handle edits)
  const [processedMessages, setProcessedMessages] = useState<Record<string, { content: string; category: string; editedAt: string | null }>>({});
  // State to track the current category index, incremented by "/cloud"
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);
  // Ref for the container div where D3 will render the SVG
  const svgRef = useRef<HTMLDivElement>(null);
  // State to store container dimensions for responsive layout
  const [dimensions, setDimensions] = useState<[number, number]>([0, 0]);

  const subscriptionResponse = pluginApi.useCustomSubscription<PublicChatMessagesData>(
    PUBLIC_CHAT_MESSAGES_SUBSCRIPTION,
  );
  // Removed userListBasicInf hook as sender info is not needed for word counts

  // Reset state when activatedAt changes (plugin restarted with "start from now")
  useEffect(() => {
    if (activatedAt) {
      setWordCounts({});
      setCategorizedWordCounts({});
      setProcessedMessages({});
      setCurrentCategoryIndex(0);
    }
  }, [activatedAt]);

  useEffect(() => {
    // Check if the subscription data is available and contains messages
    if (subscriptionResponse.data?.chat_message_public
        && Array.isArray(subscriptionResponse.data.chat_message_public)) {
      const newMessages = subscriptionResponse.data.chat_message_public;

      newMessages.forEach((message) => {
        // Check if the message object and ID are valid
        if (!message || !message.messageId) {
          return; // Skip this message
        }

        // Destructure needed fields
        const { messageId, message: messageText, editedAt, deletedAt, messageType } = message;

        // Check if this message was already processed
        const existingMessage = processedMessages[messageId];

        // --- Handle deleted message: remove its words ---
        if (deletedAt && existingMessage) {
          const oldWords = extractWords(existingMessage.content);
          const oldCategory = existingMessage.category;

          if (oldWords.length > 0) {
            // Decrement GLOBAL word counts for deleted message words
            setWordCounts((prevGlobalCounts) => {
              const newGlobalCounts = { ...prevGlobalCounts };
              oldWords.forEach((word) => {
                if (newGlobalCounts[word]) {
                  newGlobalCounts[word] -= 1;
                  if (newGlobalCounts[word] <= 0) {
                    delete newGlobalCounts[word];
                  }
                }
              });
              return newGlobalCounts;
            });

            // Decrement CATEGORIZED word counts for deleted message words
            setCategorizedWordCounts((prevCategorizedCounts) => {
              const newCategorizedCounts = { ...prevCategorizedCounts };
              if (newCategorizedCounts[oldCategory]) {
                oldWords.forEach((word) => {
                  if (newCategorizedCounts[oldCategory][word]) {
                    newCategorizedCounts[oldCategory][word] -= 1;
                    if (newCategorizedCounts[oldCategory][word] <= 0) {
                      delete newCategorizedCounts[oldCategory][word];
                    }
                  }
                });
                // Remove category if empty
                if (Object.keys(newCategorizedCounts[oldCategory]).length === 0) {
                  delete newCategorizedCounts[oldCategory];
                }
              }
              return newCategorizedCounts;
            });
          }

          // Remove from processed messages
          setProcessedMessages((prev) => {
            const newProcessed = { ...prev };
            delete newProcessed[messageId];
            return newProcessed;
          });
          return; // Skip further processing for deleted messages
        }

        // Skip deleted messages that we haven't processed yet
        if (deletedAt) {
          return;
        }

        // Skip messages without text content
        if (!messageText) {
          return;
        }

        // Skip plugin messages (e.g., Q&A plugin, poll messages, etc.)
        // Only process 'default' message type (regular user chat messages)
        if (!messageType || messageType !== 'default') {
          return; // Skip non-default message types (plugin, poll, presentation, etc.)
        }

        // Skip messages created before activation if activatedAt is set
        if (activatedAt && message.createdAt) {
          const messageTimestamp = new Date(message.createdAt).getTime();
          if (messageTimestamp < activatedAt) {
            return; // Skip this message
          }
        }

        // Check if this is an edited message that we've already processed
        const isEdited = existingMessage && editedAt && existingMessage.editedAt !== editedAt;
        const isNewMessage = !existingMessage;

        // Skip if already processed and not edited
        if (existingMessage && !isEdited) {
          return;
        }

        // --- Check for /cloud command ---
        if (messageText.trim() === '/cloud') {
          // Only increment category for new /cloud commands, not edits
          if (isNewMessage) {
            setCurrentCategoryIndex((prevIndex) => prevIndex + 1);
            setProcessedMessages((prev) => ({
              ...prev,
              [messageId]: { content: messageText, category: String(currentCategoryIndex), editedAt },
            }));
          }
          return; // Skip to the next message
        }

        // --- Handle edited message: remove old words first ---
        if (isEdited && existingMessage) {
          const oldWords = extractWords(existingMessage.content);
          const oldCategory = existingMessage.category;

          if (oldWords.length > 0) {
            // Decrement GLOBAL word counts for old words
            setWordCounts((prevGlobalCounts) => {
              const newGlobalCounts = { ...prevGlobalCounts };
              oldWords.forEach((word) => {
                if (newGlobalCounts[word]) {
                  newGlobalCounts[word] -= 1;
                  if (newGlobalCounts[word] <= 0) {
                    delete newGlobalCounts[word];
                  }
                }
              });
              return newGlobalCounts;
            });

            // Decrement CATEGORIZED word counts for old words
            setCategorizedWordCounts((prevCategorizedCounts) => {
              const newCategorizedCounts = { ...prevCategorizedCounts };
              if (newCategorizedCounts[oldCategory]) {
                oldWords.forEach((word) => {
                  if (newCategorizedCounts[oldCategory][word]) {
                    newCategorizedCounts[oldCategory][word] -= 1;
                    if (newCategorizedCounts[oldCategory][word] <= 0) {
                      delete newCategorizedCounts[oldCategory][word];
                    }
                  }
                });
                // Remove category if empty
                if (Object.keys(newCategorizedCounts[oldCategory]).length === 0) {
                  delete newCategorizedCounts[oldCategory];
                }
              }
              return newCategorizedCounts;
            });
          }
        }

        // --- Process message (new or edited) ---
        const currentCategory = isEdited && existingMessage ? existingMessage.category : String(currentCategoryIndex);
        const words = extractWords(messageText);

        // Update processed messages state
        setProcessedMessages((prev) => ({
          ...prev,
          [messageId]: { content: messageText, category: currentCategory, editedAt },
        }));

        if (words.length > 0) {
          // Update GLOBAL word counts
          setWordCounts((prevGlobalCounts) => {
            const newGlobalCounts = { ...prevGlobalCounts };
            words.forEach((word) => {
              newGlobalCounts[word] = (newGlobalCounts[word] || 0) + 1;
            });
            return newGlobalCounts;
          });

          // Update CATEGORIZED word counts using the currentCategory string
          setCategorizedWordCounts((prevCategorizedCounts) => {
            const newCategorizedCounts = { ...prevCategorizedCounts };
            // Ensure the category entry exists
            if (!newCategorizedCounts[currentCategory]) {
              newCategorizedCounts[currentCategory] = {};
            }
            words.forEach((word) => {
              newCategorizedCounts[currentCategory][word] = (newCategorizedCounts[currentCategory][word] || 0) + 1;
            });
            return newCategorizedCounts;
          });
        }
      });

    }
    // Depend only on the subscription data
  }, [subscriptionResponse.data]); // Removed processedMessageIds from dependencies

  // --- D3 Word Cloud Logic ---

  // Define min/max font sizes
  const minFontSize = 24;
  const maxFontSize = 120;
  // Color parameters removed - will use d3.schemeCategory10

  // Calculate min and max counts for normalization (still needed for font size)
  const counts = Object.values(wordCounts);
  const minCount = counts.length > 0 ? Math.min(...counts) : 1;
  const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

  // Define a categorical color scale using a bright scheme suitable for dark backgrounds
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Effect to setup ResizeObserver for responsive layout
  useEffect(() => {
    if (!svgRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions([width, height]);
    });

    resizeObserver.observe(svgRef.current);

    // Set initial dimensions
    const { clientWidth, clientHeight } = svgRef.current;
    setDimensions([clientWidth, clientHeight]);

    // Cleanup observer on component unmount
    return () => resizeObserver.disconnect();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to run D3 layout when wordCounts or dimensions change
  useEffect(() => {
    // Store layout instance reference for cleanup
    // Correct type for the layout instance returned by cloud()
    // const layoutInstance = null;

    const [width, height] = dimensions; // Get current dimensions from state

    if (!svgRef.current || width === 0 || height === 0) {
      return; // Don't run if ref isn't ready or dimensions are zero
    }

    if (Object.keys(wordCounts).length === 0) {
      // Handle the "no words" case - draw placeholder
      // Remove any existing SVG (either word cloud or placeholder)
      d3.select(svgRef.current).select('svg').remove();

      // Create a placeholder SVG with centered text using current dimensions
      const placeholderSvg = d3.select(svgRef.current)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'no-messages-placeholder-svg') // Add class to SVG for removal
        .style('background-color', '#000000'); // Match background

      placeholderSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('dy', '0.35em') // Adjust vertical alignment slightly
        .style('fill', '#ccc') // Light gray color for dark background
        .style('font-size', '24px')
        .style('text-anchor', 'middle') // Center text horizontally
        .text(intl.formatMessage(intlMessages.startTyping)); // Use intl for message

      return; // Exit after drawing placeholder
    }

    // --- Proceed with Word Cloud Drawing ---

    // Clear any placeholder SVG if it exists
    d3.select(svgRef.current).select('.no-messages-placeholder-svg').remove();

    // Define margin and calculate layout area
    const margin = 10; // Define margin in pixels
    const layoutWidth = width - margin * 2;
    const layoutHeight = height - margin * 2;

    // Ensure layout dimensions are not negative
    if (layoutWidth <= 0 || layoutHeight <= 0) {
      return;
    }

    // --- Dynamic Font Size Calculation ---
    const numUniqueWords = Object.keys(wordCounts).length;
    const wordCountThreshold = 20; // Threshold for adjusting min font size
    let effectiveMinFontSize = minFontSize; // Start with the default min size

    if (numUniqueWords > 0 && numUniqueWords < wordCountThreshold) {
      // If fewer words than threshold, increase the minimum size
      // Interpolate between minFontSize and a midpoint based on how few words there are
      const midFontSize = (minFontSize + maxFontSize) / 2;
      // boostFactor goes from 0 (at threshold-1 words) to 1 (at 1 word)
      const boostFactor = (wordCountThreshold - numUniqueWords) / (wordCountThreshold - 1);
      effectiveMinFontSize = minFontSize + (midFontSize - minFontSize) * boostFactor;
    }

    // Calculate min/max counts for normalization (needed for font size scaling)
    const counts = Object.values(wordCounts);
    const minCount = counts.length > 0 ? Math.min(...counts) : 1;
    const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

    // Define font size calculation logic *inside* the effect to use effectiveMinFontSize
    const calculateDynamicFontSize = (count: number): number => {
      if (maxCount === minCount) {
        // If all counts are the same, use an average of the effective min and max
        return (effectiveMinFontSize + maxFontSize) / 2;
      }
      // Linear interpolation between effectiveMinFontSize and maxFontSize
      const size = effectiveMinFontSize + ((count - minCount) / (maxCount - minCount)) * (maxFontSize - effectiveMinFontSize);
      // Clamp within the dynamic bounds (effectiveMinFontSize to maxFontSize)
      return Math.max(effectiveMinFontSize, Math.min(size, maxFontSize));
    };

    // Prepare data for d3-cloud from categorized counts
    // Each entry represents a unique word within a specific category (minute)
    const wordsData: WordData[] = [];
    Object.entries(categorizedWordCounts).forEach(([category, wordsInCategory]) => {
      Object.entries(wordsInCategory).forEach(([wordText, countInCategory]) => {
        // Get the GLOBAL count for font size calculation
        const globalCount = wordCounts[wordText] || 1; // Fallback to 1 if somehow missing
        wordsData.push({
          text: wordText,
          size: calculateDynamicFontSize(globalCount), // Size based on GLOBAL count
          count: globalCount, // Store global count in WordData for consistency with size
          category, // The category index string ('0', '1', '2', ...)
          // Let d3-cloud calculate x, y, rotate etc.
        });
      });
    });

    // --- Category-Based Layout ---
    // Group the generated wordsData by category (minute string)
    const wordsByCategory = wordsData.reduce((acc, word) => {
      const { category } = word;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(word);
      return acc;
    }, {} as Record<string, WordData[]>);

    const categories = Object.keys(wordsByCategory);
    const numCategories = categories.length;

    if (numCategories === 0) {
      // Potentially draw placeholder or clear SVG if needed, though handled earlier
      return;
    }

    // Calculate grid dimensions
    const cols = Math.ceil(Math.sqrt(numCategories));
    const rows = Math.ceil(numCategories / cols);
    const cellWidth = layoutWidth / cols;
    const cellHeight = layoutHeight / rows;

    const allLayoutPromises: Promise<WordData[]>[] = [];
    const allPositionedWords: WordData[] = []; // Array to collect results

    categories.forEach((category, index) => {
      const categoryWords = wordsByCategory[category];
      if (!categoryWords || categoryWords.length === 0) return; // Skip empty categories

      const colIndex = index % cols;
      const rowIndex = Math.floor(index / cols);
      const offsetX = colIndex * cellWidth;
      const offsetY = rowIndex * cellHeight;

      const layoutPromise = new Promise<WordData[]>((resolve) => {
        const categoryLayout = cloud<WordData>() // Specify WordData type here
          .size([cellWidth, cellHeight])
          .words(categoryWords) // Pass only words for this category
          .padding(1) // Maybe smaller padding within cells
          .rotate(() => (~~(Math.random() * 6) - 3) * 15) // Less rotation?
          .font('Tahoma')
          .fontSize((d) => d.size || 10) // Use size from WordData
          .on('end', (positionedWords: WordData[]) => {
            // Adjust positions relative to the cell's offset
            const adjustedWords = positionedWords.map((word) => ({
              ...word,
              x: (word.x || 0) + offsetX + cellWidth / 2, // Center within cell + offset
              y: (word.y || 0) + offsetY + cellHeight / 2, // Center within cell + offset
            }));
            resolve(adjustedWords);
          });
        categoryLayout.start();
      });
      allLayoutPromises.push(layoutPromise);
    });

    // Wait for all category layouts to complete
    Promise.all(allLayoutPromises).then((results) => {
      const combinedWords = results.flat(); // Combine words from all categories
      draw(combinedWords, width, height, margin); // Call draw with all positioned words
    });
    // --- End Category-Based Layout ---

    // Helper function to ensure color is not too dark
    const ensureLightColor = (colorString: string): string => {
      const darkThreshold = 0x66; // Equivalent to #666666
      const defaultLightColor = '#cccccc';
      try {
        const color = d3.color(colorString);
        if (!color) return defaultLightColor; // Fallback if color parsing fails

        const { r, g, b } = color.rgb();
        // Check if all components are below the threshold
        if (r <= darkThreshold && g <= darkThreshold && b <= darkThreshold) {
          return defaultLightColor; // Return light grey if too dark
        }
        return colorString; // Return original color if light enough
      } catch (e) {
        return defaultLightColor; // Fallback on error
      }
    };

    // Draw function: Renders the words using D3, now receives dimensions/margin
    // This function remains largely the same, but now receives words already positioned globally
    function draw(words: WordData[], svgWidth: number, svgHeight: number, svgMargin: number) {

      // Select the container, ensure SVG exists, or create it
      const svg = d3.select(svgRef.current)
        .selectAll<SVGSVGElement, unknown>('svg') // Use selectAll for potential existing SVG
        .data([null]) // Bind data to ensure only one SVG
        .join('svg') // Use join for enter/update/exit logic on the SVG itself
        .attr('width', svgWidth) // Use passed width
        .attr('height', svgHeight) // Use passed height
        .style('background-color', '#000000'); // Set background to black

      // Select the main group element, translate by the margin
      const g = svg.selectAll<SVGGElement, unknown>('g')
        .data([null])
        .join('g')
      // Translate group by the margin, as word coords are now relative to layout area top-left
        .attr('transform', `translate(${svgMargin}, ${svgMargin})`);

      // Define color scale within draw function scope to use helper
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      // D3 data join for text elements, using WordData
      const text = g.selectAll<SVGTextElement, WordData>('text')
        .data(words, (d) => d.text || ''); // Use word text as key

      // --- Exit Selection ---
      text.exit()
        .transition() // Fade out words that are no longer present
        .duration(1600) // Match previous transition duration
        .style('fill-opacity', 1e-6)
        .attr('font-size', 1)
        .remove();

      // --- Update Selection ---
      text.transition() // Smoothly transition existing words
        .duration(1600) // Match previous transition duration
      // Use calculated x, y directly; they already include offsets
        .attr('transform', (d) => `translate(${d.x || 0},${d.y || 0}) rotate(${d.rotate || 0})`)
        .attr('font-size', (d) => `${d.size}px`)
        .style('fill-opacity', 1)
        // Ensure the fill color is light enough
        .style('fill', (d) => ensureLightColor(colorScale(d.text || '')));

      // --- Enter Selection ---
      text.enter() // Add text.enter() back here
        .append('text')
        .style('font-family', 'Impact') // Match font used in layout
      // Ensure the initial fill color is light enough
        .style('fill', (d: WordData) => ensureLightColor(colorScale(d.text || '')))
        .attr('text-anchor', 'middle')
      // Use calculated x, y directly for initial position
        .attr('transform', (d: WordData) => `translate(${d.x || 0},${d.y || 0}) rotate(${d.rotate || 0})`)
        .text((d: WordData) => d.text || '') // Add type WordData
      // Initial state for transition
        .style('fill-opacity', 1e-6) // Start transparent for fade-in
        .attr('font-size', 1)
        .transition() // Fade in and grow new words
        .duration(1600) // Match previous transition duration
        .style('fill-opacity', 1)
        .attr('font-size', (d: WordData) => `${d.size}px`); // Add type WordData
    }

    // Cleanup function for when the component unmounts or dependencies change
    return () => {
      // if (layoutInstance) {
      //   layoutInstance.stop(); // Stop the layout process if it's still running
      // }
    };
  }, [wordCounts, categorizedWordCounts, dimensions]); // Re-run effect when counts or dimensions change

  // --- Rendering Logic ---
  // Render a div container that D3 will use
  return (
    <div
      ref={svgRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden', // Prevent scrollbars if SVG slightly overflows
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 2, // Keep lower than reactions overlay
      }}
    />
  );
} // <-- Add missing closing brace for the PluginWordCloud function

export default PluginWordCloud;

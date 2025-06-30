export const CATEGORIES = {
  progress: {
    id: 'progress',
    name: 'Progress & Growth',
    icon: 'TrendingUp',
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconBg: 'bg-green-500',
    description: 'Personal growth, relationship development, continuous improvement'
  },
  value: {
    id: 'value',
    name: 'Value Creation',
    icon: 'Target',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconBg: 'bg-blue-500',
    description: 'Business opportunities, making money, solving problems for profit'
  },
  energy: {
    id: 'energy',
    name: 'Energy/Bitcoin',
    icon: 'Zap',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconBg: 'bg-yellow-500',
    description: 'Energy sector insights, bitcoin mining, stranded energy, cryptocurrency'
  },
  human: {
    id: 'human',
    name: 'Human Optimization',
    icon: 'Brain',
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    iconBg: 'bg-purple-500',
    description: 'Human optimization, purpose, resistance training, helping people achieve potential'
  },
  uncategorized: {
    id: 'uncategorized',
    name: 'Needs Processing',
    icon: 'FileText',
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    iconBg: 'bg-gray-500',
    description: 'Ideas that need manual categorization or processing'
  }
} as const;

export type CategoryId = keyof typeof CATEGORIES;

export const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.7) return 'green';
  if (confidence >= 0.5) return 'yellow';
  return 'red';
};

export const getConfidenceBadgeClass = (confidence: number) => {
  const color = getConfidenceColor(confidence);
  return {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
  }[color];
};

export const getConfidenceBorderClass = (confidence: number) => {
  const color = getConfidenceColor(confidence);
  return {
    green: 'border-l-4 border-green-500',
    yellow: 'border-l-4 border-yellow-500',
    red: 'border-l-4 border-red-500',
  }[color];
};

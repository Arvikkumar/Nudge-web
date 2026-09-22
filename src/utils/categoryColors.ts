export interface CategoryStyle {
  bg: string;
  text: string;
}

export const getCategoryStyle = (category: string): CategoryStyle => {
  switch (category.toLowerCase()) {
    case 'home':
      return {
        bg: 'bg-[#EFF7EE] dark:bg-[#1D2F22]',
        text: 'text-[#2A7E35] dark:text-[#A2E4AA]',
      };
    case 'work':
      return {
        bg: 'bg-[#F3EEF9] dark:bg-[#2E223D]',
        text: 'text-[#6B48B8] dark:text-[#D2B3F9]',
      };
    case 'shopping':
      return {
        bg: 'bg-[#FFF0E6] dark:bg-[#382318]',
        text: 'text-[#D45512] dark:text-[#FFAB78]',
      };
    case 'personal':
      return {
        bg: 'bg-[#EBF1FF] dark:bg-[#1E283C]',
        text: 'text-[#2E62F6] dark:text-[#96B7FF]',
      };
    default:
      return {
        bg: 'bg-[#F5F1EB] dark:bg-[#2D2A26]',
        text: 'text-[#6D635C] dark:text-[#DDD7CE]',
      };
  }
};

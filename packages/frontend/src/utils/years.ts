// Year options for Select inputs, newest first.
const THIS_YEAR = new Date().getFullYear();

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => {
    const year = String(to - i);
    return { label: year, value: year };
  });

// Alumni graduation year: 1950 … this year + 5 (within the 1900 – this year + 10 range the server accepts).
export const graduationYearOptions = range(1950, THIS_YEAR + 5);

// Student expected graduation year: this year … this year + 8 (same as the server).
export const expectedYearOptions = range(THIS_YEAR, THIS_YEAR + 8);

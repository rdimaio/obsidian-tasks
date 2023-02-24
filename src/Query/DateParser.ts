import * as chrono from 'chrono-node';
import moment from 'moment';

export class DateParser {
    public static parseDate(input: string, forwardDate: boolean = false): moment.Moment {
        // Using start of day to correctly match on comparison with other dates (like equality).
        return window
            .moment(
                chrono.parseDate(input, undefined, {
                    forwardDate: forwardDate,
                }),
            )
            .startOf('day');
    }

    /**
     * Parse a line and extract a pair of dates, returned in a tuple, sorted by date.
     * @param input - any pair of dates, separate by one or more spaces '17 August 2013 19 August 2013',
     *                or a single date.
     * @return - A Tuple of dates. If both input dates are invalid, then both ouput dates will be invalid.
     */
    public static parseDateRange(input: string): [moment.Moment, moment.Moment] {
        const result = chrono.parse(input, undefined, {
            forwardDate: true,
        });

        if (result.length === 0) {
            return [moment.invalid(), moment.invalid()];
        }

        const startDate = result[0].start;
        const endDate = result[1] && result[1].start ? result[1].start : startDate;
        const start = window.moment(startDate.date());
        const end = window.moment(endDate.date());

        let dateRange: [moment.Moment, moment.Moment] = [start, end];
        if (end.isBefore(start)) {
            dateRange = [end, start];
        }

        const naturalDateRangeRegexp = /(last|this|next) (week|month|quarter|year)/;
        const naturalDateRangeMatch = input.match(naturalDateRangeRegexp);
        if (naturalDateRangeMatch && naturalDateRangeMatch.length === 3) {
            const lastThisNext = naturalDateRangeMatch[1];
            const delta = moment.duration();
            const range = naturalDateRangeMatch[2];
            switch (range) {
                case 'month':
                case 'quarter':
                case 'year':
                    dateRange = [window.moment().startOf(range), window.moment().endOf(range)];
                    delta.add(1, range);
                    break;
                case 'week':
                    dateRange = [window.moment().startOf('isoWeek'), window.moment().endOf('isoWeek')];
                    delta.add(1, range);
                    break;
            }

            switch (lastThisNext) {
                case 'last':
                    dateRange.forEach((d) => d.subtract(delta));
                    break;
                case 'next':
                    dateRange.forEach((d) => d.add(delta));
                    break;
            }
        }

        // Dates shall be at midnight eg 00:00
        dateRange.forEach((d) => d.startOf('day'));
        return dateRange;
    }
}

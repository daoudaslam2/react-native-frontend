import {
  createEmptyQazaCounts,
  getIshaPartCounts,
  getTotalQaza,
  type QazaCounts,
  useQazaStore,
} from '../src/features/qaza/qazaStore';

function createCounts(overrides: Partial<QazaCounts> = {}): QazaCounts {
  return {
    ...createEmptyQazaCounts(),
    ...overrides,
  };
}

describe('qaza store', () => {
  beforeEach(() => {
    useQazaStore.setState({
      counts: createEmptyQazaCounts(),
      ishaSplitEnabled: false,
    });
  });

  it('enables separate Isha Fardh and Witr display without changing flat counts', () => {
    useQazaStore.getState().replaceCounts(
      createCounts({
        isha_fardh: 5,
        isha_witr: 5,
      }),
    );

    useQazaStore.getState().setIshaSplitEnabled(true);

    expect(useQazaStore.getState().ishaSplitEnabled).toBe(true);
    expect(getIshaPartCounts(useQazaStore.getState().counts)).toEqual({
      fardh: 5,
      witr: 5,
    });
    expect(getTotalQaza(useQazaStore.getState().counts, true)).toBe(10);
  });

  it('keeps Isha Fardh and Witr synchronized while combined mode is shown', () => {
    useQazaStore.getState().replaceCounts(
      createCounts({
        isha_fardh: 5,
        isha_witr: 5,
      }),
    );

    useQazaStore.getState().completeOne('isha');

    expect(useQazaStore.getState().ishaSplitEnabled).toBe(false);
    expect(getIshaPartCounts(useQazaStore.getState().counts)).toEqual({
      fardh: 4,
      witr: 4,
    });
    expect(getTotalQaza(useQazaStore.getState().counts, false)).toBe(4);
  });

  it('completes only the selected Isha part when split is enabled', () => {
    useQazaStore.getState().replaceCounts(
      createCounts({
        isha_fardh: 5,
        isha_witr: 5,
      }),
      true,
    );

    useQazaStore.getState().completeOne('isha', 'fardh');

    expect(getIshaPartCounts(useQazaStore.getState().counts)).toEqual({
      fardh: 4,
      witr: 5,
    });
    expect(getTotalQaza(useQazaStore.getState().counts, true)).toBe(9);
  });

  it('keeps Isha split enabled until both counts match', () => {
    useQazaStore.getState().replaceCounts(
      createCounts({
        isha_fardh: 4,
        isha_witr: 5,
      }),
      true,
    );

    useQazaStore.getState().setIshaSplitEnabled(false);

    expect(useQazaStore.getState().ishaSplitEnabled).toBe(true);

    useQazaStore.getState().replaceCounts(
      createCounts({
        isha_fardh: 4,
        isha_witr: 4,
      }),
      true,
    );
    useQazaStore.getState().setIshaSplitEnabled(false);

    expect(useQazaStore.getState().ishaSplitEnabled).toBe(false);
    expect(getIshaPartCounts(useQazaStore.getState().counts)).toEqual({
      fardh: 4,
      witr: 4,
    });
  });

  it('adds a missed split Isha to both Fardh and Witr counts', () => {
    useQazaStore.getState().replaceCounts(
      createCounts({
        isha_fardh: 2,
        isha_witr: 2,
      }),
      true,
    );

    useQazaStore.getState().addMissed('isha');

    expect(getIshaPartCounts(useQazaStore.getState().counts)).toEqual({
      fardh: 3,
      witr: 3,
    });
    expect(getTotalQaza(useQazaStore.getState().counts, true)).toBe(6);
  });
});

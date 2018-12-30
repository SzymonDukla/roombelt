import { action } from "utils/redux";
import cancellationToken from "utils/cancellation-token";
import screenfull from "screenfull";
import axios from "axios";

import { createDevice, getDeviceDetails, removeAuth } from "services/api";

import {
  calendarNameSelector,
  currentActionSelector,
  currentMeetingSelector,
  isCalendarSelectedSelector,
  isDashboardDeviceSelector,
  isInitializedSelector,
  isInOfflineModeSelector,
  lastActivityOnShowCalendarsViewSelector, minutesForCheckInSelector, requireCheckInSelector,
  showAllCalendarsViewSelector,
  timestampSelector
} from "apps/device/store/selectors";
import { changeLanguage } from "i18n";

import i18next from "i18next";
import * as api from "services/api";
import { wait, waitUntilTrue } from "utils/time";


export const deviceActions = {
  $markInitialized: action(),
  initialize: () => async (dispatch, getState) => {
    if (isInitializedSelector(getState())) {
      return;
    }

    dispatch(deviceActions.$initializeApiVersionObserver());
    dispatch(deviceActions.$markInitialized());

    try {
      await getDeviceDetails();
    } catch (error) {
      if (error.response && error.response.status === 403) {
        await createDevice();
      }
    }

    dispatch(deviceActions.$startClock());
    dispatch(deviceActions.$fetchDeviceData());
    dispatch(deviceActions.$initializeFullScreenSupport());
    dispatch(deviceActions.$initializeOfflineObserver());
  },

  $updateDeviceData: action(device => ({ device })),
  $fetchDeviceData: () => async (dispatch, getState) => {
    const token = cancellationToken(deviceActions.$fetchDeviceData).cancelOthers();

    try {
      const shouldGetAllCalendars = showAllCalendarsViewSelector(getState());
      const device = await getDeviceDetails(shouldGetAllCalendars);

      if (token.isCancelled()) {
        return;
      }

      dispatch(deviceActions.$updateDeviceData(device));
      dispatch(deviceActions.setLanguage(device.language));
      dispatch(deviceActions.$removeCurrentMeetingIfNotCheckedIn());
    } catch (error) {
      if (error.response && error.response.status === 404) {
        dispatch(deviceActions.$markRemoved());
      }
    }

    const timeout = (isDashboardDeviceSelector(getState()) || isCalendarSelectedSelector(getState())) ? 30000 : 5000;

    await wait(timeout);

    if (token.isCancelled()) {
      return;
    }

    dispatch(deviceActions.$fetchDeviceData());
  },
  $removeCurrentMeetingIfNotCheckedIn: () => async (dispatch, getState) => {
    if (!requireCheckInSelector(getState())) {
      return;
    }

    const meeting = currentMeetingSelector(getState());
    if (!meeting || meeting.isCheckedIn) {
      return;
    }

    // Don't remove meetings 2 minutes after `minutesForCheckIn`
    // This is to avoid removing meetings in-progress after Roombelt renews connection to the server
    const minutesForCheckIn = minutesForCheckInSelector(getState());
    const timeFromStartInMinutes = (timestampSelector(getState()) - meeting.startTimestamp) / 1000 / 60;
    if (timeFromStartInMinutes <= minutesForCheckIn || timeFromStartInMinutes >= minutesForCheckIn + 2) {
      return;
    }

    // Don't automatically remove very long meetings (e.g. whole day events)
    const meetingDurationInMinutes = (meeting.endTimestamp - meeting.startTimestamp) / 1000 / 60;
    if (meetingDurationInMinutes >= 240) {
      return;
    }

    await api.deleteMeeting(meeting.id);
    dispatch(deviceActions.$fetchDeviceData());
  },

  $updateClock: action(timestamp => ({ timestamp })),
  $startClock: () => dispatch => {
    dispatch(deviceActions.$updateClock(Date.now()));

    setInterval(() => dispatch(deviceActions.$updateClock(Date.now())), 10 * 1000);
  },

  $updateFullScreenState: action((isSupported, isFullScreen) => ({ isSupported, isFullScreen })),
  $initializeFullScreenSupport: () => dispatch => {
    const updateStatus = () => {
      dispatch(deviceActions.$updateFullScreenState(screenfull.enabled, screenfull.isFullscreen));
    };

    updateStatus();

    if (typeof screenfull.onchange === "function") {
      screenfull.onchange(updateStatus);
    }
  },
  requestFullScreen: () => () => {
    if (screenfull.enabled) {
      screenfull.request();
    }
  },

  $updateOfflineStatus: action(isOffline => ({ isOffline })),
  $initializeOfflineObserver: () => (dispatch, getState) => {
    const successCallback = result => {
      if (isInOfflineModeSelector(getState())) {
        dispatch(meetingActions.endAction());
        dispatch(deviceActions.$updateOfflineStatus(false));
      }

      return result;
    };

    const errorCallback = error => {
      if (error.response === undefined && !isInOfflineModeSelector(getState())) {
        dispatch(deviceActions.$updateOfflineStatus(true));
      }

      return Promise.reject(error);
    };

    axios.interceptors.response.use(successCallback, errorCallback);
  },

  $initializeApiVersionObserver: () => async () => {
    let currentVersion = undefined;

    const checkVersion = async () => {
      const response = await api.getApiVersion();

      if (response && response.version && currentVersion && currentVersion !== response.version) {
        window.location.reload();
      }

      if (response) {
        currentVersion = response.version;
      }
    };

    setInterval(checkVersion, 1000 * 60 * 5);
    await checkVersion();
  },

  $markRemoved: action(),
  disconnectDevice: () => async () => {
    await removeAuth();
    window.location.reload();
  },

  setLanguage: language => () => changeLanguage(language),

  $updateShowAllCalendarsView: action(showAllCalendarsView => ({ showAllCalendarsView })),
  $allCalendarsViewActivity: action(() => ({ timestamp: Date.now() })),

  showAllCalendarsView: () => async (dispatch, getState) => {
    dispatch(deviceActions.$updateShowAllCalendarsView(true));
    dispatch(deviceActions.$allCalendarsViewActivity());
    dispatch(deviceActions.$fetchDeviceData());

    await waitUntilTrue(() => lastActivityOnShowCalendarsViewSelector(getState()) < Date.now() - 30 * 1000);

    dispatch(deviceActions.closeAllCalendarsView());
  },

  closeAllCalendarsView: () => dispatch => {
    dispatch(meetingActions.endAction());
    dispatch(deviceActions.$updateShowAllCalendarsView(false));
  }
};

export const meetingActions = {
  $startAction: action((currentAction) => ({ currentAction })),
  endAction: action(),
  $setActionError: action(),
  $setActionSource: action(source => ({ source })),
  $setActionIsRetrying: action(),
  $setActionSuccess: action(),

  retry: () => (dispatch, getState) => {
    dispatch(meetingActions.$setActionIsRetrying());
    dispatch(currentActionSelector(getState()));
  },

  createMeeting: (timeInMinutes) => (dispatch, getState) => {
    dispatch(meetingActions.$startAction(meetingActions.createMeeting(timeInMinutes)));

    const roomName = calendarNameSelector(getState());
    const createMeetingPromise = api.createMeeting(timeInMinutes, i18next.t("meeting.quick-meeting-title", { roomName }));

    dispatch(meetingActions.$handleMeetingActionPromise(createMeetingPromise));
  },

  cancelMeeting: () => async (dispatch, getState) => {
    dispatch(meetingActions.$startAction(meetingActions.cancelMeeting()));

    const currentMeetingId = currentMeetingSelector(getState()).id;
    const deleteMeetingPromise = api.deleteMeeting(currentMeetingId);

    dispatch(meetingActions.$handleMeetingActionPromise(deleteMeetingPromise));
  },

  endMeeting: () => dispatch => {
    dispatch(meetingActions.$startAction(meetingActions.endMeeting()));

    dispatch(meetingActions.$updateCurrentMeeting({ endNow: true }));
  },

  checkInToMeeting: () => dispatch => {
    dispatch(meetingActions.$startAction(meetingActions.checkInToMeeting()));

    dispatch(meetingActions.$updateCurrentMeeting({ checkIn: true }));
  },

  extendMeeting: timeInMinutes => async dispatch => {
    dispatch(meetingActions.$startAction(meetingActions.extendMeeting(timeInMinutes)));

    dispatch(meetingActions.$updateCurrentMeeting({ extensionTime: timeInMinutes }));
  },

  startMeetingEarly: () => async dispatch => {
    dispatch(meetingActions.$startAction(meetingActions.startMeetingEarly()));

    dispatch(meetingActions.$updateCurrentMeeting({ checkIn: true, startNow: true }));
  },

  $updateCurrentMeeting: options => (dispatch, getState) => {
    const currentMeetingId = currentMeetingSelector(getState()).id;
    const updateMeetingPromise = api.updateMeeting(currentMeetingId, options);

    dispatch(meetingActions.$handleMeetingActionPromise(updateMeetingPromise));
  },

  $handleMeetingActionPromise: actionPromise => async dispatch => {
    try {
      await actionPromise;

      dispatch(deviceActions.$updateDeviceData(await getDeviceDetails()));
      dispatch(meetingActions.endAction());
    } catch (error) {
      console.error(error);
      dispatch(meetingActions.$setActionError());
    }
  },

  createMeetingInAnotherRoom: (calendarId, timeInMinutes) => async (dispatch, getState) => {
    dispatch(meetingActions.$startAction(meetingActions.createMeetingInAnotherRoom(calendarId, timeInMinutes)));

    const roomName = calendarNameSelector(getState(), { calendarId });

    try {
      await api.createMeeting(timeInMinutes, i18next.t("meeting.quick-meeting-title", { roomName }), calendarId);

      dispatch(deviceActions.$updateDeviceData(await getDeviceDetails(true)));
      dispatch(meetingActions.$setActionSuccess());
    } catch (error) {
      console.error(error);
      dispatch(meetingActions.$setActionError());
    }
  }
};
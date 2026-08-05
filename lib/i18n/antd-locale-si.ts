import type { Locale } from "antd/es/locale";
import enUS from "antd/locale/en_US";

/**
 * Sinhala locale for antd's own built-in component chrome (Modal OK/Cancel,
 * Table filter/sort menus, Popconfirm, Empty, Upload, Transfer, Text actions,
 * Form's "(optional)" suffix). antd does not ship an official si_LK locale.
 *
 * DatePicker/TimePicker/Calendar/Pagination are intentionally left on the
 * English locale: translating those requires a full dayjs Sinhala locale
 * (month/weekday names, ordinals, relative-time strings) which is a
 * substantial standalone effort tracked separately, not partially faked here.
 */
export const antdLocaleSi: Locale = {
  ...enUS,
  locale: "si",
  global: {
    placeholder: "කරුණාකර තෝරන්න",
    close: "වසන්න",
  },
  Table: {
    filterTitle: "පෙරහන් මෙනුව",
    filterConfirm: "හරි",
    filterReset: "යළි සකසන්න",
    filterEmptyText: "පෙරහන් නැත",
    filterCheckAll: "සියලුම අයිතම තෝරන්න",
    filterSearchPlaceholder: "පෙරහන් තුළ සොයන්න",
    emptyText: "දත්ත නැත",
    selectAll: "වත්මන් පිටුව තෝරන්න",
    selectInvert: "වත්මන් පිටුව අනුලෝම කරන්න",
    selectNone: "සියලුම දත්ත හිස් කරන්න",
    selectionAll: "සියලුම දත්ත තෝරන්න",
    sortTitle: "වර්ග කරන්න",
    expand: "පේළිය විස්තාරණය කරන්න",
    collapse: "පේළිය හකුළන්න",
    triggerDesc: "අවරෝහණව වර්ග කිරීමට ක්ලික් කරන්න",
    triggerAsc: "ආරෝහණව වර්ග කිරීමට ක්ලික් කරන්න",
    cancelSort: "වර්ග කිරීම අවලංගු කිරීමට ක්ලික් කරන්න",
  },
  Modal: {
    okText: "හරි",
    cancelText: "අවලංගු කරන්න",
    justOkText: "හරි",
  },
  Popconfirm: {
    okText: "හරි",
    cancelText: "අවලංගු කරන්න",
  },
  Transfer: {
    ...enUS.Transfer,
    searchPlaceholder: "මෙහි සොයන්න",
    itemUnit: "අයිතමය",
    itemsUnit: "අයිතම",
    remove: "ඉවත් කරන්න",
    selectCurrent: "වත්මන් පිටුව තෝරන්න",
    removeCurrent: "වත්මන් පිටුව ඉවත් කරන්න",
    selectAll: "සියලුම දත්ත තෝරන්න",
    deselectAll: "සියලුම දත්ත තේරීම ඉවත් කරන්න",
    removeAll: "සියලුම දත්ත ඉවත් කරන්න",
    selectInvert: "වත්මන් පිටුව අනුලෝම කරන්න",
  },
  Upload: {
    uploading: "උඩුගත කරමින්...",
    removeFile: "ගොනුව ඉවත් කරන්න",
    uploadError: "උඩුගත කිරීමේ දෝෂයකි",
    previewFile: "ගොනුව පෙරදසුන් කරන්න",
    downloadFile: "ගොනුව බාගන්න",
  },
  Empty: {
    description: "දත්ත නැත",
  },
  Text: {
    edit: "සංස්කරණය",
    copy: "පිටපත් කරන්න",
    copied: "පිටපත් කරන ලදී",
    expand: "විස්තාරණය කරන්න",
    collapse: "හකුළන්න",
  },
  Form: {
    defaultValidateMessages: enUS.Form!.defaultValidateMessages,
    optional: "(විකල්පයි)",
  },
};

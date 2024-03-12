import $ from "jquery";
import { InputBinding } from "./inputBinding";
import { $escape, hasDefinedProperty, updateLabel } from "../../utils";

type RadioHTMLElement = HTMLInputElement;

type ValueLabelObject = {
  value: HTMLInputElement["value"];
  label: string;
};

type RadioReceiveMessageData = {
  value?: string | [];
  options?: ValueLabelObject[];
  label: string;
};

// Get the DOM element that contains the top-level label
function getLabelNode(el: RadioHTMLElement): JQuery<HTMLElement> {
  return $(el)
    .parent()
    .find('label[for="' + $escape(el.id) + '"]');
}
// Given an input DOM object, get the associated label. Handles labels
// that wrap the input as well as labels associated with 'for' attribute.
function getLabel(obj: HTMLElement): string | null {
  const parentNode = obj.parentNode as HTMLElement;

  // If <label><input /><span>label text</span></label>
  if (parentNode.tagName === "LABEL") {
    return $(parentNode).find("span").text().trim();
  }

  return null;
}
// Given an input DOM object, set the associated label. Handles labels
// that wrap the input as well as labels associated with 'for' attribute.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setLabel(obj: HTMLElement, value: string): null {
  const parentNode = obj.parentNode as HTMLElement;

  // If <label><input /><span>label text</span></label>
  if (parentNode.tagName === "LABEL") {
    $(parentNode).find("span").text(value);
  }

  return null;
}

class RadioInputBinding extends InputBinding {
  find(scope: HTMLElement): JQuery<HTMLElement> {
    return $(scope).find(".shiny-input-radiogroup");
  }
  getValue(
    el: RadioHTMLElement
  ): string[] | number | string | null | undefined {
    // Select the radio objects that have name equal to the grouping div's id
    const checkedItems = $(
      'input:radio[name="' + $escape(el.id) + '"]:checked'
    );

    if (checkedItems.length === 0) {
      // If none are checked, the input will return null (it's the default on load,
      // but it wasn't emptied when calling updateRadioButtons with character(0)
      return null;
    }

    return checkedItems.val();
  }
  setValue(el: RadioHTMLElement, value: string | []): void {
    if (Array.isArray(value) && value.length === 0) {
      // Removing all checked item if the sent data is empty
      $('input:radio[name="' + $escape(el.id) + '"]').prop("checked", false);
    } else {
      $(
        'input:radio[name="' +
          $escape(el.id) +
          '"][value="' +
          $escape(value) +
          '"]'
      ).prop("checked", true);
    }
  }
  getState(el: RadioHTMLElement): {
    label: string;
    value: ReturnType<RadioInputBinding["getValue"]>;
    options: ValueLabelObject[];
  } {
    const $objs = $(
      'input:radio[name="' + $escape(el.id) + '"]'
    ) as JQuery<RadioHTMLElement>;

    // Store options in an array of objects, each with with value and label
    const options = new Array($objs.length);

    for (let i = 0; i < options.length; i++) {
      options[i] = { value: $objs[i].value, label: getLabel($objs[i]) };
    }

    return {
      label: getLabelNode(el).text(),
      value: this.getValue(el),
      options: options,
    };
  }
  async receiveMessage(
    el: RadioHTMLElement,
    data: RadioReceiveMessageData
  ): Promise<void> {
    const $el = $(el);
    // This will replace all the options

    if (hasDefinedProperty(data, "options")) {
      // Clear existing options and add each new one
      $el.find("div.shiny-options-group").remove();
      // Backward compatibility: for HTML generated by shinybootstrap2 package
      $el.find("label.radio").remove();
      // @ts-expect-error; TODO-barret; IDK what this line is doing
      // TODO-barret; Should this line be setting attributes instead?
      // `data.options` is an array of `{value, label}` objects
      $el.append(data.options);
    }

    if (hasDefinedProperty(data, "value")) {
      this.setValue(el, data.value);
    }

    await updateLabel(data.label, getLabelNode(el));

    $(el).trigger("change");
  }
  subscribe(el: RadioHTMLElement, callback: (x: boolean) => void): void {
    $(el).on("change.radioInputBinding", function () {
      callback(false);
    });
  }
  unsubscribe(el: RadioHTMLElement): void {
    $(el).off(".radioInputBinding");
  }
}

export { RadioInputBinding };
export type { RadioReceiveMessageData };

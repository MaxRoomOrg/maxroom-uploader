import { CheckIcon, Combobox, Group, Pill, PillsInput, useCombobox } from "@mantine/core";
import { useState } from "react";
import type { JSX } from "react";

// TODO: update with dynamic data
const Scripts = [
  "/home/user/documents/file1.js",
  "/home/user/documents/file2.js",
  "/home/user/pictures/image1.js",
  "/home/user/pictures/image2.js",
];

export function CreatableSelect(): JSX.Element {
  const combobox = useCombobox();

  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [search, setSearch] = useState<string>("");

  const exactScriptMatch = Scripts.some((script) => {
    return script === search;
  });

  const handleScriptSelect = (script: string) => {
    if (selectedScripts.includes(script) === false) {
      setSelectedScripts([...selectedScripts, script]);
    }
  };

  const handleCreateScript = () => {
    Scripts.push(search);
    setSelectedScripts([...selectedScripts, search]);
    setSearch("");
  };

  const handleRemoveSelectedScript = (script: string) => {
    setSelectedScripts((prevSelectedScript) => {
      return prevSelectedScript.filter((selectedScript) => {
        return selectedScript !== script;
      });
    });
  };

  const scriptOptions = Scripts.filter((script) => {
    return script.toLowerCase().includes(search.trim().toLowerCase());
  }).map((script) => {
    return (
      <>
        <Combobox.Option value={script} key={script} active={selectedScripts.includes(script)}>
          <Group gap="sm">
            {selectedScripts.includes(script) ? <CheckIcon size={12} /> : null}
            {script}
          </Group>
        </Combobox.Option>
      </>
    );
  });

  return (
    // Ref: https://mantine.dev/combobox/?e=MultiSelectCreatable
    <Combobox store={combobox} onOptionSubmit={handleScriptSelect}>
      <Combobox.DropdownTarget>
        <PillsInput
          onClick={() => {
            combobox.openDropdown();
          }}
        >
          <Pill.Group>
            {selectedScripts.map((script) => {
              return (
                <Pill
                  key={script}
                  withRemoveButton
                  onRemove={() => {
                    handleRemoveSelectedScript(script);
                  }}
                >
                  {script}
                </Pill>
              );
            })}

            <Combobox.EventsTarget>
              <PillsInput.Field
                onFocus={() => {
                  combobox.openDropdown();
                }}
                onBlur={() => {
                  combobox.closeDropdown();
                }}
                placeholder="Select or add scripts"
                value={search}
                onChange={(e) => {
                  combobox.updateSelectedOptionIndex();
                  setSearch(e.currentTarget.value);
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>
      <Combobox.Dropdown>
        <Combobox.Options>
          {scriptOptions}
          {/* Add a "Create" option if no matching scripts are found */}
          {exactScriptMatch === false && search.trim().length > 0 && scriptOptions.length === 0 ? (
            <Combobox.Option value="$create" onClick={handleCreateScript}>
              + Create &quot;{search}&quot;
            </Combobox.Option>
          ) : null}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
